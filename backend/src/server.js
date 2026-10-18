
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { pool } from './db.js';

const app = express();

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4100'
]);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed'));
  },
  credentials: true
}));

app.use(express.json({ limit: '12kb' }));
app.use(express.urlencoded({ extended: false, limit: '12kb' }));

// LOCAL SECURITY LAB ONLY. Do not expose this application publicly.
const isMode = mode => ['vulnerable', 'safe'].includes(mode);

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

// ==========================================
// DEMO SESSION HELPERS
// ==========================================

const demoSessions = new Map();

function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';').filter(Boolean).map(part => {
      const index = part.indexOf('=');
      return [
        part.slice(0, index).trim(),
        part.slice(index + 1).trim()
      ];
    })
  );
}

function requireDemoSession(req, res, next) {
  const sessionId = parseCookies(req.headers.cookie).ua_session;
  const session = demoSessions.get(sessionId);

  if (!session) {
    return res.status(401).json({
      error: 'Demo session required'
    });
  }

  req.demoSession = session;
  next();
}

function validRecoveryEmail(email) {
  return email.length <= 150 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({
      status: 'error',
      message: 'Database unavailable'
    });
  }
});

// ==========================================
// COURSES AND ASSESSMENTS
// ==========================================

app.get('/api/courses', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM courses ORDER BY code'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/assessments', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.max_marks,
              c.code AS course_code
       FROM assessments a
       JOIN courses c ON c.id = a.course_id
       ORDER BY a.id`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// REFLECTED XSS
// ==========================================

app.get('/api/:mode/search', async (req, res, next) => {
  const { mode } = req.params;

  if (!isMode(mode)) {
    return res.status(404).json({ error: 'Unknown mode' });
  }

  const q = String(req.query.q ?? '').slice(0, 500);

  try {
    const { rows } = await pool.query(
      `SELECT * FROM courses
       WHERE code ILIKE $1 OR title ILIKE $1
       ORDER BY code`,
      [`%${q}%`]
    );

    const shown = mode === 'vulnerable'
      ? q
      : escapeHTML(q);

    res.json({
      query: q,
      headingHtml: `Search results for: ${shown}`,
      courses: rows
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// STORED XSS
// ==========================================

app.get('/api/discussions', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.id, d.author, d.body,
              d.created_at, c.code AS course_code
       FROM discussions d
       JOIN courses c ON c.id = d.course_id
       ORDER BY d.id DESC
       LIMIT 100`
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/discussions', async (req, res, next) => {
  const author = String(req.body?.author ?? '').trim();
  const body = String(req.body?.body ?? '').trim();
  const courseId = Number(req.body?.courseId);

  if (
    !author ||
    author.length > 80 ||
    !body ||
    body.length > 3000 ||
    !Number.isInteger(courseId)
  ) {
    return res.status(400).json({
      error: 'Author, course and message required.'
    });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO discussions(course_id, author, body)
       VALUES ($1, $2, $3)
       RETURNING id, author, body, created_at`,
      [courseId, author, body]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Invalid course' });
    }
    next(error);
  }
});

// ==========================================
// CSRF — DEMO LOGIN / SESSION
// ==========================================

app.post('/api/lab/session', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, recovery_email
       FROM lab_profiles
       WHERE email = $1`,
      ['demo.ta@cfd.nu.edu.pk']
    );

    if (!rows.length) {
      return res.status(404).json({
        error: 'Demo TA not found'
      });
    }

    const sessionId = crypto.randomBytes(24).toString('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');

    demoSessions.set(sessionId, {
      profileId: rows[0].id,
      csrfToken
    });

    res.cookie('ua_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/'
    });

    res.json({
      message: 'Demo session created',
      profile: rows[0],
      csrfToken
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CSRF — FETCH TA PROFILE
// ==========================================

app.get('/api/lab/profile', requireDemoSession, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, recovery_email
       FROM lab_profiles
       WHERE id = $1`,
      [req.demoSession.profileId]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CSRF — RECOVERY EMAIL UPDATE
// ==========================================

app.post(
  '/api/lab/:mode/recovery-email',
  requireDemoSession,
  async (req, res, next) => {
    try {
      const { mode } = req.params;

      if (!isMode(mode)) {
        return res.status(404).json({
          error: 'Unknown mode'
        });
      }

      if (mode === 'safe') {
        const submittedToken = req.get('x-csrf-token');

        if (
          typeof submittedToken !== 'string' ||
          !submittedToken ||
          submittedToken !== req.demoSession.csrfToken
        ) {
          return res.status(403).json({
            error: 'Invalid or missing CSRF token'
          });
        }
      }

      const recoveryEmail = String(
        req.body?.recoveryEmail ?? ''
      ).trim();

      if (!validRecoveryEmail(recoveryEmail)) {
        return res.status(400).json({
          error: 'Invalid recovery email'
        });
      }

      const { rows } = await pool.query(
        `UPDATE lab_profiles
         SET recovery_email = $1
         WHERE id = $2
         RETURNING id, name, email, recovery_email`,
        [recoveryEmail, req.demoSession.profileId]
      );

      res.json({
        message: 'Recovery email updated',
        profile: rows[0]
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// ERROR HANDLER
// ==========================================

app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(500).json({
    error: 'Server error'
  });
});

// ==========================================
// SERVER
// ==========================================

const port = Number(process.env.PORT || 5000);

app.listen(port, '127.0.0.1', () => {
  console.log(
    `UniAssess security lab: http://127.0.0.1:${port}`
  );
});
