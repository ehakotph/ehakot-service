import { Strategy as LocalStrategy } from 'passport-local';
import Account from '../models/public/account.model';

export const localStrategy = new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password',
    },
    async (email, password, done) => {
        try {
            const normalizedEmail = email.toLowerCase().trim();
            const account = await Account.findOne({ where: { email: normalizedEmail } });

            if (!account) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            const isMatch = await account.comparePassword(password);

            if (!isMatch) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            return done(null, account);
        } catch (error) {
            return done(error);
        }
    }
);
