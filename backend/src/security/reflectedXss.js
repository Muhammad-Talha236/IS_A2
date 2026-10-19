import { pool } from '../db.js';
import { isMode, escapeHTML } from '../utils/input.js';
export async function searchCourses(req, res, next) {
  const { mode } = req.params;

  if (!isMode(mode)) {
    return res.status(404).json({
      error: 'Unknown mode'
    });
  }

  const q = String(req.query.q ?? '').slice(0, 500);

  try {
    const { rows } = await pool.query(
      `SELECT *
       FROM courses
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
}
