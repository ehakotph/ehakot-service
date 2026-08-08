import { Sequelize } from 'sequelize-typescript';
import { env } from '@config/env';
import Account from '@/models/public/account.model';
import Barangay from '@/models/public/barangay.model';
import City from '@/models/public/city.model';
import Collection from '@/models/public/collection.model';
import GarbageReport from '@/models/public/garbage-report.model';
import Notification from '@/models/public/notification.model';
import Truck from '@/models/public/truck.model';

const database_url: string = env.DATABASE_URL;
// Vercel doesn't support dynamic model path so we import models manually
// const model_path = `/../models/**/*.model.${env.NODE_ENV === 'production' ? 'js' : 'ts'}`;

const dialectOptions: Record<string, unknown> = {};

if (env.DATABASE_USE_SSL) {
    dialectOptions.ssl = {
        require: true,
        rejectUnauthorized: false
    }
}

const sequelize: Sequelize = new Sequelize(database_url, {
    logging: false,
    models: [Account, Barangay, City, Collection, GarbageReport, Notification, Truck],
    dialectOptions,
    define: {
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    },
});

export async function testDatabaseConnection(): Promise<void> {
    try {
        await sequelize.authenticate();
        console.info(`Database Connection: ${database_url}`);
    } catch (error: unknown) {
        console.error('Unable to connect to the database', error);
    }
}

export default sequelize;