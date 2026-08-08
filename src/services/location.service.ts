/**
 * Haversine distance formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371e3; // Earth radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function normalizeStreetName(street: string): string {
    if (!street) return '';
    return street
        .toLowerCase()
        .replace(/\b(st\.?|street)\b/g, 'st')
        .replace(/\b(ave\.?|avenue)\b/g, 'ave')
        .replace(/\b(rd\.?|road)\b/g, 'rd')
        .replace(/\b(blvd\.?|boulevard)\b/g, 'blvd')
        .replace(/\b(dr\.?|drive)\b/g, 'dr')
        .replace(/\b(ln\.?|lane)\b/g, 'ln')
        .replace(/[^\w\s]/g, '') // remove punctuation
        .replace(/\s+/g, ' ') // collapse multiple spaces
        .trim();
}

const geocodeCache = new Map<string, string>();
let lastRequestTime = 0;

export async function getStreetName(lat: number, lon: number): Promise<string | null> {
    const cacheKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
    
    if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey)!;
    }

    // Rate limiting for Nominatim (1 req/sec)
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLast));
    }
    lastRequestTime = Date.now();

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'ehakot-service-test/1.0 (contact@ehakot.com)',
                    'Accept-Language': 'en'
                }
            }
        );

        if (!response.ok) {
            console.error('Nominatim API error:', response.status, response.statusText);
            return null;
        }

        const data = await response.json() as Record<string, unknown>;
        
        const address: Record<string, unknown> | null = data?.address as Record<string, unknown> || null;
        const street: string | null = (address?.road || address?.pedestrian || address?.path) as string | null;
        
        if (street) {
            geocodeCache.set(cacheKey, street);
        }
        
        return street;
    } catch (error) {
        console.error('Reverse geocoding fetch failed:', error);
        return null;
    }
}

interface LocationDetails {
    city: string | null;
    barangay: string | null;
}

const locationDetailsCache = new Map<string, LocationDetails>();

export async function getLocationDetails(lat: number, lon: number): Promise<LocationDetails> {
    const cacheKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
    
    if (locationDetailsCache.has(cacheKey)) {
        return locationDetailsCache.get(cacheKey)!;
    }

    // Rate limiting for Nominatim (1 req/sec)
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLast));
    }
    lastRequestTime = Date.now();

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'ehakot-service-test/1.0 (contact@ehakot.com)',
                    'Accept-Language': 'en'
                }
            }
        );

        if (!response.ok) {
            console.error('Nominatim API error:', response.status, response.statusText);
            return { city: null, barangay: null };
        }

        const data = await response.json() as Record<string, unknown>;
        console.log("data :>> ", data)
        const address: Record<string, unknown> | null = data?.address as Record<string, unknown> || null;
        
        const city: string | null = (address?.city || address?.town || address?.municipality || address?.county) as string | null;
        const barangay: string | null = (address?.quarter || address?.neighbourhood || address?.road || address?.amenity) as string | null;
        
        const details = { city, barangay };
        locationDetailsCache.set(cacheKey, details);
        
        return details;
    } catch (error) {
        console.error('Reverse geocoding fetch failed:', error);
        return { city: null, barangay: null };
    }
}
