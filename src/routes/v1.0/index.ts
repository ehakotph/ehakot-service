import { Router } from 'express';
import authRouter from './auth';
import emailRouter from './email';
import accountRouter from './accounts';

const router = Router();

router.use('/auth', authRouter);
router.use('/email', emailRouter);
router.use('/accounts', accountRouter);

export default router;
