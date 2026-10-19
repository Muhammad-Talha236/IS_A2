
import { Router } from 'express';
import { pool } from './db.js';

// Local classroom security lab.
// Use fictional records only. Never deploy vulnerable routes.

export const sqlRoutes = Router();

const validMode = (mode) =>
  mode === 'vulnerable' || mode === 'safe';

function checkMode(req, res) {
  if (!validMode(req.params.mode)) {
    res.status(404).json({ error: 'Unknown mode' });
    return false;
  }
  return true;
}

const input = (value, max = 250) =>
  String(value ?? '').slice(0, max);

function queryError(res, error, message) {
  // Keep diagnostics on the backend; never log submitted credentials.
  console.error('SQL lab query failed:', error.code || error.name);
  if (['42601', '42703', '42P10', '42804', '22001', '22003', '22P02'].includes(error.code)) {
    return res.status(400).json({ error: message });
  }
  if (error.code === '42P01') {
    return res.status(503).json({ error: 'Security-lab tables missing. Run npm run db:setup in backend.' });
  }
  return res.status(503).json({ error: 'Security-lab database unavailable. Check backend logs.' });
}

// ==========================================
// EASY SQL INJECTION — TA LOGIN
// ==========================================

sqlRoutes.post('/:mode/login', async (req, res) => {
  if (!checkMode(req, res)) return;

  const email = input(req.body?.email, 150);
  const password = input(req.body?.password, 150);

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password required'
    });
  }

  try {
    const baseQuery =
      'SELECT id, name, email, role FROM lab_users WHERE email = ';

    const result = req.params.mode === 'vulnerable'
      ? await pool.query(
          `${baseQuery}'${email}' AND password = '${password}' LIMIT 1`
        )
      : await pool.query(
          `${baseQuery}$1 AND password = $2 LIMIT 1`,
          [email, password]
        );

    if (!result.rows.length) {
      return res.status(401).json({
        authenticated: false,
        message: 'Invalid credentials'
      });
    }

    return res.json({
      authenticated: true,
      user: result.rows[0]
    });
  } catch (error) {
    return queryError(res, error, 'Invalid query or input');
  }
});

// ==========================================
// INTERMEDIATE — BLIND BOOLEAN SQL INJECTION
// ==========================================

sqlRoutes.get('/:mode/grade-availability', async (req, res) => {
  if (!checkMode(req, res)) return;

  const courseCode = input(req.query.courseCode, 150);

  try {
    const result = req.params.mode === 'vulnerable'
      ? await pool.query(
          `SELECT id FROM lab_grade_availability
           WHERE course_code = '${courseCode}'
           AND published = true
           LIMIT 1`
        )
      : await pool.query(
          `SELECT id FROM lab_grade_availability
           WHERE course_code = $1
           AND published = true
           LIMIT 1`,
          [courseCode]
        );

    return res.json({
      available: result.rows.length > 0,
      message: result.rows.length
        ? 'Grade available'
        : 'No published grade'
    });
  } catch (error) {
    return queryError(res, error, 'Query rejected');
  }
});

// ==========================================
// ADVANCED SQL INJECTION — STUDENT RECORDS
// ==========================================

// Fictional records only.
// The vulnerable query has three text columns for
// controlled UNION and database metadata demonstrations.

sqlRoutes.get('/:mode/student-records', async (req, res) => {
  if (!checkMode(req, res)) return;

  const rollNo = input(req.query.rollNo, 350);

  try {
    const baseQuery = `
      SELECT
        roll_no::text AS roll_no,
        student_name::text AS student_name,
        result::text AS result
      FROM lab_student_records
      WHERE roll_no = `;

    const result = req.params.mode === 'vulnerable'
      ? await pool.query(`${baseQuery}'${rollNo}'`)
      : await pool.query(`${baseQuery}$1`, [rollNo]);

    return res.json({
      records: result.rows
    });
  } catch (error) {
    return queryError(res, error, 'Query rejected (column mismatch or SQL syntax)');
  }
});
