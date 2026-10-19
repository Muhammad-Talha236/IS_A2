import { Router } from 'express';
import { profileSession, getProfile, updateRecoveryEmail } from '../controllers/profile.controller.js';
import { requireCsrf } from '../security/csrf.js';
const router = Router();
router.post('/session', profileSession);
router.get('/profile', getProfile);
router.post('/:mode/recovery-email', (req, res, next) => req.params.mode === 'safe' ? requireCsrf(req, res, next) : next(), updateRecoveryEmail);
export default router;
