import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../utilities/database';
import Collection from '../models/public/collection.model';
import City from '../models/public/city.model';
import { getLocationDetails } from '../services/location.service';

/** Extract YYYY-MM-DD from any Date-parseable value. */
const toDateKey = (v: string | Date): string => new Date(v).toISOString().slice(0, 10);

export const createCollection = async (req: Request, res: Response): Promise<void> => {
    const transaction = await sequelize.transaction();

    try {
        const { date, city_id, driver_id, barangays, truck_id, from, to, status } = req.body;
        let { dates } = req.body;

        const isBatch = Array.isArray(dates) && dates.length > 0;

        // Backward compatibility: accept single `date` field
        if (!isBatch) {
            if (date) {
                dates = [date];
            } else {
                res.status(400).json({ message: 'dates must be a non-empty array of strings, or a single date must be provided.', data: false });
                return;
            }
        }

        // Coerce IDs once for comparison
        const numCityId = Number(city_id);
        const numDriverId = Number(driver_id);
        const numTruckId = Number(truck_id);
        const barangaySet = new Set<string>(barangays);

        // Build date ranges for the query (start/end of each day)
        const dateRanges = dates.map((d: string) => {
            const start = new Date(d);
            start.setHours(0, 0, 0, 0);
            const end = new Date(d);
            end.setHours(23, 59, 59, 999);
            return { [Op.between]: [start, end] };
        });

        // Single query to fetch all existing collections across all requested dates
        const existingCollections = await Collection.findAll({
            where: { date: { [Op.or]: dateRanges } },
            transaction,
        });

        // Pre-index existing collections by date key for O(1) lookup
        const existingByDate = new Map<string, Collection[]>();
        for (const col of existingCollections) {
            const key = toDateKey(col.date);
            const list = existingByDate.get(key);
            if (list) list.push(col);
            else existingByDate.set(key, [col]);
        }

        // Validate each date against existing records
        for (const dateStr of dates) {
            const key = toDateKey(dateStr);
            const collectionsOnDate = existingByDate.get(key) ?? [];

            for (const existing of collectionsOnDate) {
                const sameDriver = driver_id && Number(existing.driver_id) === numDriverId;
                const sameTruck = truck_id && Number(existing.truck_id) === numTruckId;
                const sameCity = city_id && Number(existing.city_id) === numCityId;
                const sameBarangay = sameCity && existing.barangays.some((b: string) => barangaySet.has(b));
                const timeOverlap = from < existing.to && to > existing.from;

                if ((sameDriver || sameTruck) && sameBarangay && timeOverlap) {
                    throw new Error(
                        `A collection with the same date, city, barangay, truck, and driver already exists with overlapping time on ${dateStr}.`
                    );
                }
            }
        }

        // Prepare records and bulk-insert in a single query
        const records = dates.map((d: string) => {
            const dateObj = new Date(d);
            return {
                city_id,
                driver_id,
                barangays,
                status: status || 'PENDING',
                truck_id,
                date_of_week: dateObj.getDay(),
                date: dateObj,
                from,
                to,
            };
        });

        const createdRecords = await Collection.bulkCreate(records, { transaction });

        await transaction.commit();

        res.status(201).json({
            message: isBatch ? 'Collections created successfully' : 'Collection created successfully',
            data: isBatch ? createdRecords : createdRecords[0],
        });
    } catch (error: unknown) {
        await transaction.rollback();
        res.status(400).json({
            message: 'Collection could not be created.',
            data: error instanceof Error ? error.message : String(error),
        });
    }
};

export const getCollectionsByLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lat, lng, city, barangay } = req.body;
        let searchCityName = city as string | undefined;
        let searchBarangayName = barangay as string | undefined;

        if (lat && lng) {
            const details = await getLocationDetails(Number(lat), Number(lng));
            if (details.city) {
                searchCityName = details.city;
            }
            if (details.barangay) {
                searchBarangayName = details.barangay;
            }
        }

        if (!searchCityName || !searchBarangayName) {
            res.status(400).json({ message: 'Both city and barangay are required, either directly or via lat/lng.' });
            return;
        }

        // find city by name (case-insensitive partial match)
        const cityRecord = await City.findOne({
            where: {
                name: { [Op.iLike]: `%${searchCityName}%` }
            }
        });

        if (!cityRecord) {
            res.status(404).json({ message: 'City not found.', data: [] });
            return;
        }

        const collections = await Collection.findAll({
            where: { city_id: cityRecord.id },
            include: [{ all: true }] // Include associations like Driver, Truck
        });

        // filter by barangay in memory
        const filteredCollections = collections.filter(c => {
            if (!c.barangays || !Array.isArray(c.barangays)) return false;
            // Case insensitive search
            const searchBgy = searchBarangayName!.toLowerCase();
            return c.barangays.some((b: string) => b.toLowerCase() === searchBgy);
        });

        res.status(200).json({ data: filteredCollections });
    } catch (error) {
        console.error('Error fetching collections by location:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
