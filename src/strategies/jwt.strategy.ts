import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import Account from '../models/public/account.model';
import { env } from '@config/env';

const public_key = Buffer.from(env.PUBLIC_ACCESS_KEY, 'base64').toString('ascii');

export const jwtStrategy = new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: public_key,
        algorithms: ['RS256'],
    },
    async (jwtPayload, done) => {
        try {
            const account = await Account.findByPk(jwtPayload.id);

            if (!account) {
                return done(null, false, { message: 'User not found' });
            }

            return done(null, account);
        } catch (error) {
            return done(error, false);
        }
    }
);
