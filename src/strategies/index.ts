import passport from 'passport';
import { localStrategy } from './local.strategy';
import { jwtStrategy } from './jwt.strategy';

export function initializePassport() {
    passport.use(localStrategy);
    passport.use(jwtStrategy);
}
