import type { Request, Response } from 'express';
import GarbageReport from '../models/public/garbage-report.model';
import { fn, col, type WhereOptions, Op } from 'sequelize';
import City from '@/models/public/city.model';

interface HeatmapReportData {
    city: string;
    barangays: {
        name: string;
        report_count: number;
    }[];
}

interface RawReportData {
    location_city: string;
    location_barangay: string;
    report_count: string;
}

export const getHeatmapReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            status = 'ACTIVE',
            date,
            startDate,
            endDate,
            city_id,
        } = req.query;

        const whereClause: WhereOptions = {
            status,
        };

        // Filter by city_id (convert to city name)
        if (city_id && typeof city_id === 'string') {
            const city = await City.findByPk(Number(city_id));

            if (!city) {
                res.status(404).json({
                    message: 'City not found',
                });
                return;
            }

            whereClause.location_city = city.name;
        }

        // Filter by a specific date
        if (date && typeof date === 'string') {
            const targetDate = new Date(date);

            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            whereClause.createdAt = {
                [Op.between]: [startOfDay, endOfDay],
            };
        }
        // Filter by date range
        else if (startDate || endDate) {
            const dateFilter: Record<symbol, Date> = {};

            if (startDate && typeof startDate === 'string') {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                dateFilter[Op.gte] = start;
            }

            if (endDate && typeof endDate === 'string') {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter[Op.lte] = end;
            }

            whereClause.created_at = dateFilter;
        }

        const reports = await GarbageReport.findAll({
            where: whereClause,
            attributes: [
                'location_city',
                'location_barangay',
                [fn('COUNT', col('id')), 'report_count'],
            ],
            group: ['location_city', 'location_barangay'],
            raw: true,
        });

        const cityMap: Record<string, HeatmapReportData> = {};

        for (const report of reports as unknown as RawReportData[]) {
            const city = report.location_city;
            const barangay = report.location_barangay;
            const count = Number(report.report_count);

            if (!cityMap[city]) {
                cityMap[city] = {
                    city,
                    barangays: [],
                };
            }

            cityMap[city].barangays.push({
                name: barangay,
                report_count: count,
            });
        }

        res.status(200).json({
            message: 'Heatmap report data retrieved successfully',
            data: Object.values(cityMap),
        });
    } catch (error) {
        res.status(500).json({
            message: 'Could not retrieve heatmap report data',
            data: error instanceof Error ? error.message : String(error),
        });
    }
};
