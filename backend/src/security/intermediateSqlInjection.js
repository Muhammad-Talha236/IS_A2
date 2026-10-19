import { checkMode, input, queryError } from '../utils/sql.js';
import { labQuery } from '../services/labQuery.js';

export async function gradeAvailability(req, res) {
  if (!checkMode(req, res)) return;

  const courseCode = input(req.query.courseCode, 150);

  try {
    const result = req.params.mode === 'vulnerable'
      ? await labQuery(
          `SELECT id FROM lab_grade_availability
           WHERE course_code = '${courseCode}'
           AND published = true
           LIMIT 1`
        )
      : await labQuery(
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
}
