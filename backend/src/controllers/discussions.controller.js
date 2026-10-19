import { pool } from '../db.js';

export async function listDiscussions(_req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT
         d.id,
         d.author,
         d.body,
         d.created_at,
         c.code AS course_code
       FROM discussions d
       JOIN courses c ON c.id = d.course_id
       ORDER BY d.id DESC
       LIMIT 100`
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createDiscussion(req, res, next) {
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
      return res.status(400).json({
        error: 'Invalid course'
      });
    }

    next(error);
  }
}
