import type { Request, Response } from 'express';
import { 
    calculateDistance, 
    // getStreetName, 
    // normalizeStreetName 
} from '../services/location.service';
import Account from '../models/public/account.model';
import Notification from '../models/public/notification.model';
import GarbageReport from '../models/public/garbage-report.model';
import { Op, Sequelize } from 'sequelize';
import { sendTemplateEmail } from '../utilities/nodemailer';
import Collection from '@/models/public/collection.model';
import Truck from '@/models/public/truck.model';
import City from '@/models/public/city.model';

// For testing purposes (location radius + street name)
// I think street is unnecessary, maybe let's just lower the radius?
export const checkProximity = async (req: Request, res: Response): Promise<void> => {
    try {
        const { driver, user, radius } = req.body;

        const distance = calculateDistance(driver.lat, driver.lng, user.lat, user.lng);
        const withinRadius = distance <= radius;

        // const driverStreetRaw = await getStreetName(driver.lat, driver.lng);
        // const userStreetRaw = await getStreetName(user.lat, user.lng);

        // if (!driverStreetRaw || !userStreetRaw) {
        //      res.status(503).json({
        //         error: 'Service Unavailable',
        //         message: 'Could not determine street names from coordinates.',
        //     });
        //     return;
        // }

        // const driverStreetNorm = normalizeStreetName(driverStreetRaw);
        // const userStreetNorm = normalizeStreetName(userStreetRaw);

        // const sameStreet = driverStreetNorm === userStreetNorm;
        // const isNear = withinRadius && sameStreet;

         res.json({
            // isNear,
            withinRadius,
            // sameStreet,
            distance: Number(distance.toFixed(2)),
            // driverStreet: driverStreetRaw,
            // userStreet: userStreetRaw,
        });
        return;
    } catch (error) {
        console.error('Error in checkProximity:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
    }
};

const DriverLocations: Record<string, { lat: number; lng: number; collection_id?: number; city?: string; barangay?: string; driver_id: string, driver: Account }> = {};

export const updateDriverLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { driver_id, lat, lng, collection_id } = req.body;
        let { driver } = req.body;

        if(!driver) {
            driver = await Account.findByPk(driver_id);
        }

        // save to in-memory cache
        DriverLocations[driver_id] = { driver_id, lat, lng, collection_id, driver };

        const driverLat = Number(lat);
        const driverLng = Number(lng);

        const searchRadius = 50;

        const createHaversineLiteral = (tableName: string) => Sequelize.literal(`(
            6371000 * acos(
                least(
                    1.0,
                    cos(radians(${driverLat})) * 
                    cos(radians(("${tableName}"."location"->>'lat')::float)) * 
                    cos(radians(("${tableName}"."location"->>'lng')::float) - radians(${driverLng})) + 
                    sin(radians(${driverLat})) * 
                    sin(radians(("${tableName}"."location"->>'lat')::float))
                )
            )
        )`);

        const accountHaversineLiteral = createHaversineLiteral('Account');
        const garbageReportHaversineLiteral = createHaversineLiteral('GarbageReport');

        // fetch users with locations within the radius directly from DB
        const users = await Account.findAll({
            attributes: {
                include: [
                    [accountHaversineLiteral, 'distance']
                ]
            },
            where: {
                role: 'user',
                location: {
                    [Op.not]: null
                },
                [Op.and]: Sequelize.where(accountHaversineLiteral, {
                    [Op.lte]: searchRadius
                })
            }
        });

        const nearbyUsers = users.map(user => {
            if(!user.location) return;

            return {
                id: user.id,
                name: user.name,
                location: user.location,
                email: user.email,
                contact_number: user.contact_number,
                distance: user.get('distance'),
            };
        }).filter((u): u is NonNullable<typeof u> => u !== undefined);

        // Send email and create notification for nearby users
        nearbyUsers.forEach(user => {
            const title = 'Garbage Collector Nearby';
            const message = `A garbage collector (Driver ID: ${driver_id}) is currently ${Number(user.distance).toFixed(2)} meters away from your location.`;

            if (user.email) {
                sendTemplateEmail({
                    to: user.email,
                    subject: title,
                    templateName: 'sample',
                    context: {
                        subject: title,
                        title: 'Garbage Collector is near your location!',
                        name: user.name,
                        message
                    }
                }).catch(err => console.error(`Failed to send email to ${user.email}:`, err));
            }

            // Create notification in DB
            Notification.create({
                title,
                description: message,
                user_id: user.id,
                read_at: null,
            }).catch(err => console.error(`Failed to create notification for user ${user.id}:`, err));
        });

        // fetch active garbage reports within radius
        const nearbyReports = await GarbageReport.findAll({
            include: [Account],
            where: {
                status: 'ACTIVE',
                [Op.and]: Sequelize.where(garbageReportHaversineLiteral, {
                    [Op.lte]: searchRadius
                })
            }
        });

        // wait for all saves
        await Promise.all(nearbyReports.map(async report => {
            report.status = 'ASSUMPTION_COLLECTED';
            await report.save();

            const reportUser = report.user;
            if (reportUser) {
                const title = 'Garbage May Be Collected';
                const message = `A garbage collector was near your reported garbage location. Please confirm if your garbage was collected.`;

                if (reportUser.email) {
                    sendTemplateEmail({
                        to: reportUser.email,
                        subject: title,
                        templateName: 'sample',
                        context: {
                            subject: title,
                            title: 'Garbage Collection Confirmation',
                            name: reportUser.name,
                            message
                        }
                    }).catch(err => console.error(`Failed to send email to ${reportUser.email}:`, err));
                }

                Notification.create({
                    title,
                    description: message,
                    user_id: reportUser.id,
                    read_at: null,
                }).catch(err => console.error(`Failed to create notification for user ${reportUser.id}:`, err));
            }
        }));

        res.json({ 
            message: 'Driver location updated successfully', 
            data: DriverLocations,
            nearbyUsers,
            nearbyReports
        });
        return;
    }
    catch(error) {
        console.error('Error in updateDriverLocation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
    }
}

export const getDriverLocations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { collection_id, lat, lng, radius } = req.body;

        let drivers = Object.values(DriverLocations);

        if (collection_id) {
            drivers = drivers.filter(d => d.collection_id === Number(collection_id));
        }

        if (lat && lng && radius) {
            drivers = drivers.filter(d => calculateDistance(d.lat, d.lng, Number(lat), Number(lng)) <= Number(radius));
        }

        const driversWithData = await Promise.all(drivers.map(async (d) => {
            const collection = d.collection_id ? await Collection.findByPk(d.collection_id, { include: [Truck, City]}) : null;
            return {
                ...d,
                collection
            };
        }));

        res.json({ data: driversWithData });
        return;
    } catch (error) {
        console.error('Error in getDriverLocations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
    }
}
