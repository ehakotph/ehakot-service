import { authController } from '../../controllers/auth.controller';
import validateResource from '@/middlewares/validate-resource';
import { createAccountSchema, localAuthSchema } from '@/schemas/auth.schema';
import { Router } from 'express';
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
        passport.authenticate('local', { session: false })
    ],
    authController.login
);

authRouter.get('/me', passport.authenticate('jwt', { session: false }), authController.me);

export default authRouter;
