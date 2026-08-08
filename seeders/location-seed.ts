import { readFile } from 'fs/promises';
import path from 'path';

import sequelize from '@/utilities/database';
import City from '@/models/public/city.model';
import Barangay from '@/models/public/barangay.model';

interface GeoJsonFeature {
  properties: {
    city: string;
    name: string;
  };
}

interface GeoJson {
  features: GeoJsonFeature[];
}

async function seed() {
  try {
    await sequelize.authenticate();

    console.log('Connected to database.');

    const filePath = path.join(
      process.cwd(),
      'seeders',
      'ncr-barangays.geojson'
    );

    const raw = await readFile(filePath, 'utf8');
    const geojson = JSON.parse(raw) as GeoJson;

    //
    // STEP 1: Collect unique cities
    //
    const cityNames = [...new Set(
      geojson.features.map(f => f.properties.city.trim())
    )].sort();

    console.log(`Found ${cityNames.length} cities.`);

    //
    // STEP 2: Bulk create cities
    //
    await City.bulkCreate(
      cityNames.map(name => ({ name })),
      {
        ignoreDuplicates: true,
      }
    );

    //
    // STEP 3: Read all cities and build lookup
    //
    const cities = await City.findAll();

    const cityMap = new Map<string, number>();

    for (const city of cities) {
      cityMap.set(city.name, city.id);
    }

    //
    // STEP 4: Prepare barangays
    //
    const barangays = geojson.features.map(feature => {
      const cityName = feature.properties.city.trim();
      const cityId = cityMap.get(cityName);

      if (!cityId) {
        throw new Error(`City not found: ${cityName}`);
      }

      return {
        name: feature.properties.name.trim(),
        city_id: cityId,
      };
    });

    //
    // STEP 5: Bulk create barangays
    //
    await Barangay.bulkCreate(barangays, {
      ignoreDuplicates: true,
    });

    console.log(`Created ${cityNames.length} cities.`);
    console.log(`Created ${barangays.length} barangays.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();