import { Router } from 'express';
import emailRouter from './email';
import accountRouter from './accounts';
import cityRouter from './cities';
import authRouter from './auth';
import truckRouter from './truck';
import notificationRouter from './notifications';
import barangayRouter from './barangays';

const router = Router();

router.use('/auth', authRouter);
router.use('/email', emailRouter);
router.use('/accounts', accountRouter);
router.use('/barangays', barangayRouter)
router.use('/notifications', notificationRouter)
router.use('/trucks', truckRouter)
router.use('/cities', cityRouter)

export default router;
