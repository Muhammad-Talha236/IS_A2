import { pool } from '../db.js';

export async function listCourses(_req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM courses ORDER BY code'
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function listAssessments(_req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT
         a.id,
         a.title,
         a.max_marks,
         c.code AS course_code
       FROM assessments a
       JOIN courses c ON c.id = a.course_id
       ORDER BY a.id`
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
}
