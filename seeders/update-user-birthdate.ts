import sequelize from '@/utilities/database';
import Account from '@/models/public/account.model';

async function updateUserBirthdates() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('Connected to database.');

        const [affectedCount] = await Account.update(
            { password: null },
            { where: { role: 'user' } }
        );

        console.log(`Updated ${affectedCount} user(s) with birthdate 02-02-2000.`);
        process.exit(0);
    } catch (err) {
        console.error('Failed to update user birthdates:', err);
        process.exit(1);
    }
}

updateUserBirthdates();
