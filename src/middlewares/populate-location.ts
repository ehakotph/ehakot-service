import type { Request, Response, NextFunction } from 'express';
import { getLocationDetails } from '../services/location.service';

export const populateLocationDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { location, location_city, location_barangay } = req.body;
        if (location && location.lat != null && location.lng != null) {
            // Only fetch if city or barangay is missing
            if (!location_city || !location_barangay) {
                const lat = Number(location.lat);
                const lng = Number(location.lng);
                if (!isNaN(lat) && !isNaN(lng)) {
                    const details = await getLocationDetails(lat, lng);
                    if (details.city && !location_city) req.body.location_city = details.city;
                    if (details.barangay && !location_barangay) req.body.location_barangay = details.barangay;
                }
            }
        }
    } catch (error) {
        console.error('Error populating location details:', error);
    } finally {
        next();
    }
};
