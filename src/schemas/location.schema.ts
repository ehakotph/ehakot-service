import { z } from 'zod';

const coordinateSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
});

export const checkProximitySchema = z.object({
    body: z.object({
        driver: coordinateSchema,
        user: coordinateSchema,
        radius: z.number().positive(),
    }).strict(),
});

export const updateDriverLocationSchema = z.object({
    body: z.object({
        driver_id: z.number({ message: 'driver_id is required' }),
        lat: z.number({ message: 'lat is required' }).min(-90).max(90),
        lng: z.number({ message: 'lng is required' }).min(-180).max(180),
        collection_id: z.number().optional(),
        city: z.string().optional(),
        barangay: z.string().optional(),
    }).strict(),
});

export const getDriverLocationsSchema = z.object({
    query: z.object({
        collection_id: z.coerce.number().int().positive().optional(),
        lat: z.coerce.number().min(-90).max(90).optional(),
        lng: z.coerce.number().min(-180).max(180).optional(),
        radius: z.coerce.number().positive().optional(),
    }).strict(),
});
