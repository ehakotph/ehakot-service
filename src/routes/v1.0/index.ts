import { Router } from 'express';
import authRouter from './auth';
import emailRouter from './email';
import accountRouter from './accounts';
import cityRouter from './cities';
import collectionRouter from './collections';
import garbageReportRouter from './garbage-reports';
import notificationRouter from './notifications';
import truckRouter from './trucks';
import chatRouter from './chat';
import barangayRouter from './barangays';
import locationRouter from './locations';

const router = Router();

router.use('/auth', authRouter);
router.use('/email', emailRouter);
router.use('/accounts', accountRouter);
router.use('/barangays', barangayRouter);
router.use('/cities', cityRouter);
router.use('/collections', collectionRouter);
router.use('/garbage-reports', garbageReportRouter);
router.use('/notifications', notificationRouter);
router.use('/trucks', truckRouter);
router.use('/locations', locationRouter);
router.use('/chat', chatRouter);

export default router;
