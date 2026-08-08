import { Router } from 'express';
import { chatWithLLM } from '../../controllers/chat.controller';
import passport from 'passport';

const router = Router();

router.post('/', passport.authenticate('jwt', { session: false }), chatWithLLM);

export default router;
