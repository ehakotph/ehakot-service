import { Router } from 'express';
import { sendTestEmail } from '@/controllers/email.controller';

const router = Router();

// POST /api/v1/email/send
router.post('/send', sendTestEmail);

export default router;
