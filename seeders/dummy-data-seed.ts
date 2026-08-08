import sequelize from '@/utilities/database';
import City from '@/models/public/city.model';
import Barangay from '@/models/public/barangay.model';
import Account from '@/models/public/account.model';
import Truck from '@/models/public/truck.model';
import GarbageReport from '@/models/public/garbage-report.model';
import Collection from '@/models/public/collection.model';

function randomNCRLocation() {
    return {
        lat: 14.5 + Math.random() * 0.2, // ~ 14.5 to 14.7
        lng: 120.9 + Math.random() * 0.2, // ~ 120.9 to 121.1
    };
}

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const cities = await City.findAll();
        if (cities.length === 0) {
            console.log('No cities found. Please run the location seeder first.');
            process.exit(1);
        }

        const barangays = await Barangay.findAll();
        const barangaysByCity = new Map<number, string[]>();
        for (const b of barangays) {
            if (!barangaysByCity.has(b.city_id)) {
                barangaysByCity.set(b.city_id, []);
            }
            barangaysByCity.get(b.city_id)!.push(b.name);
        }

        const accountsData: Partial<Account>[] = [];
        const trucksData: Partial<Truck>[] = [];

        // Superadmins (2 globally)
        for (let i = 1; i <= 2; i++) {
            accountsData.push({
                name: `Super Admin ${i}`,
                role: 'superadmin',
                email: `superadmin${i}@yopmail.com`,
                password: 'password123',
                contact_number: `0912345678${i}`,
            });
        }

        for (const city of cities) {
            const cityName = city.name.replace(/\s+/g, '').toLowerCase();
            const cityBarangays = barangaysByCity.get(city.id) || [];
            
            // Admins (5 per city)
            for (let i = 1; i <= 5; i++) {
                accountsData.push({
                    name: `${city.name} Admin ${i}`,
                    role: 'admin',
                    email: `admin${i}-${cityName}@yopmail.com`,
                    password: 'password123',
                    city_id: city.id,
                    location_city: city.name,
                    contact_number: `0900${Math.floor(1000000 + Math.random() * 9000000)}`
                });
            }

            // Drivers (10 per city)
            for (let i = 1; i <= 10; i++) {
                accountsData.push({
                    name: `${city.name} Driver ${i}`,
                    role: 'driver',
                    email: `driver${i}-${cityName}@yopmail.com`,
                    password: 'password123',
                    city_id: city.id,
                    location_city: city.name,
                    contact_number: `0911${Math.floor(1000000 + Math.random() * 9000000)}`
                });
            }

            // Trucks (10 per city)
            for (let i = 1; i <= 10; i++) {
                trucksData.push({
                    plate_number: `EHA-${Math.floor(1000 + Math.random() * 9000)}`,
                    city_id: city.id
                });
            }

            // Users (15 per city)
            for (let i = 1; i <= 15; i++) {
                const randomBrgy = cityBarangays.length > 0 ? cityBarangays[Math.floor(Math.random() * cityBarangays.length)] : 'Unknown Barangay';
                accountsData.push({
                    name: `${city.name} User ${i}`,
                    role: 'user',
                    email: `user${i}-${cityName}@yopmail.com`,
                    password: 'password123',
                    city_id: city.id,
                    location_city: city.name,
                    location_barangay: randomBrgy,
                    location: randomNCRLocation(),
                    contact_number: `0999${Math.floor(1000000 + Math.random() * 9000000)}`
                });
            }
        }

        console.log('Creating accounts...');
        for (const acc of accountsData) {
            await Account.findOrCreate({
                where: { email: acc.email! },
                defaults: acc as Account,
            });
        }
        console.log(`Created ${accountsData.length} accounts.`);

        console.log('Creating trucks...');
        for (const truck of trucksData) {
            await Truck.findOrCreate({
                where: { plate_number: truck.plate_number!, city_id: truck.city_id! },
                defaults: truck as Truck
            });
        }
        console.log(`Created ${trucksData.length} trucks.`);

        const dbUsers = await Account.findAll({ where: { role: 'user' } });
        const dbDrivers = await Account.findAll({ where: { role: 'driver' } });
        const dbTrucks = await Truck.findAll();

        console.log('Preparing garbage reports and collections...');
        const reportsData: any[] = [];
        const statuses = ['ACTIVE', 'ASSUMPTION_COLLECTED', 'COLLECTED'];

        for (const user of dbUsers) {
            // Create 3-5 reports per user
            const numReports = Math.floor(Math.random() * 3) + 3;
            for (let i = 0; i < numReports; i++) {
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                
                // Random date in the past 30 days
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                
                // random offset for times
                const updateDate = status === 'COLLECTED' ? new Date(date.getTime() + 1000 * 60 * 60 * 24) : date;

                reportsData.push({
                    user_id: user.id,
                    _city_id: user.city_id, // temporary for lookup
                    location: user.location || randomNCRLocation(),
                    location_city: user.location_city!,
                    location_barangay: user.location_barangay || 'Unknown',
                    status: status,
                    confirmation_date: status === 'COLLECTED' ? updateDate : null,
                    createdAt: date,
                    updatedAt: updateDate
                });
            }
        }

        const collectedReports = reportsData.filter(r => r.status === 'COLLECTED');
        const collectionsToCreate = collectedReports.map(r => {
            const driversInCity = dbDrivers.filter(d => d.city_id === r._city_id);
            const trucksInCity = dbTrucks.filter(t => t.city_id === r._city_id);
            return {
                city_id: r._city_id,
                driver_id: driversInCity.length ? driversInCity[Math.floor(Math.random() * driversInCity.length)]?.id ?? null : null,
                truck_id: trucksInCity.length ? trucksInCity[Math.floor(Math.random() * trucksInCity.length)]?.id ?? null : null,
                barangays: [r.location_barangay],
                status: 'COMPLETED' as const,
                date_of_week: r.updatedAt.getDay(),
                date: r.updatedAt,
                from: "08:00",
                to: "17:00"
            };
        });

        const createdCollections = await Collection.bulkCreate(collectionsToCreate, { returning: true });
        console.log(`Created ${createdCollections.length} completed collections.`);

        for (let i = 0; i < collectedReports.length; i++) {
            const report = collectedReports[i];
            const collection = createdCollections[i];
            if (report && collection) {
                report.collection_id = collection.id;
            }
        }

        // Clean up temporary property
        for (const report of reportsData) {
            delete report._city_id;
        }

        await GarbageReport.bulkCreate(reportsData);
        console.log(`Created ${reportsData.length} garbage reports.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
