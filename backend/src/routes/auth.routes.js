import { Router } from 'express';
import { login, currentSession, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireCsrf } from '../security/csrf.js';
const router = Router();
router.post('/:mode/login', login);
router.get('/session', requireAuth, currentSession);
router.post('/logout', requireAuth, requireCsrf, logout);
export default router;
