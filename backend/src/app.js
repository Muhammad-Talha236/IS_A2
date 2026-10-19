import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import authRoutes from './routes/auth.routes.js';
import coursesRoutes from './routes/courses.routes.js';
import discussionsRoutes from './routes/discussions.routes.js';
import profileRoutes from './routes/profile.routes.js';
import securityRoutes from './routes/security.routes.js';
import { login } from './controllers/auth.controller.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
// All deliberately vulnerable behavior is available only on loopback, outside production.
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) {
    return res.status(403).json({ error: 'This security lab is for local development only' });
  }
  next();
});
const origins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4100', 'http://localhost:5000', 'http://127.0.0.1:5000']);
app.use(cors({ origin(origin, cb) { cb(null, !origin || origins.has(origin)); }, credentials: true }));
app.use(express.json({ limit: '12kb' }));
app.use(express.urlencoded({ extended: false, limit: '12kb' }));
// Login/logout are first-party actions. Cross-origin form submission is reserved for the CSRF lesson.
app.use(['/api/auth', '/api/sql/:mode/login'], (req, res, next) => {
  const origin = req.get('origin');
  if (origin && !['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000', 'http://127.0.0.1:5000'].includes(origin)) {
    return res.status(403).json({ error: 'Use the portal to sign in or out' });
  }
  next();
});
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch (error) { console.error('Health:', error.code); res.status(503).json({ error: 'Database unavailable' }); }
});
app.use('/api/auth', authRoutes);
// Preserve the original Easy SQL URL while establishing the same genuine session.
app.post('/api/sql/:mode/login', login);
app.use('/api', requireAuth);
app.use('/api', coursesRoutes);
app.use('/api/discussions', discussionsRoutes);
app.use('/api/lab', profileRoutes);
app.use('/api/sql', securityRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown endpoint' }));
app.use(errorHandler);
export default app;
