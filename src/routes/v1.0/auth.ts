import { authController } from '../../controllers/auth.controller';
import validateResource from '@/middlewares/validate-resource';
import { createAccountSchema, localAuthSchema } from '@/schemas/auth.schema';
import { Router, type Request, type Response, type NextFunction } from 'express';
import passport from 'passport';

const authRouter = Router();

authRouter.post(
    '/register',
    validateResource(createAccountSchema),
    authController.register
);

authRouter.post(
    '/login',
    [
        validateResource(localAuthSchema),
        (req: Request, res: Response, next: NextFunction) => {
            passport.authenticate('local', { session: false }, (err: unknown, user: Express.User | false | null, info?: { message: string }) => {
                if (err) return next(err);
                if (!user) {
                    return res.status(401).json({ message: info?.message || 'Unauthorized' });
                }
                req.user = user;
                next();
            })(req, res, next);
        }
    ],
    authController.login
);

authRouter.get('/me', passport.authenticate('jwt', { session: false }), authController.me);

authRouter.post('/birthdate-login', authController.birthdateLogin);

export default authRouter;
