import { checkMode, input, queryError } from '../utils/sql.js';
import { labQuery } from '../services/labQuery.js';

export async function studentRecords(req, res) {
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
      ? await labQuery(`${baseQuery}'${rollNo}'`)
      : await labQuery(`${baseQuery}$1`, [rollNo]);

    return res.json({
      records: result.rows
    });
  } catch (error) {
    return queryError(res, error, 'Query rejected (column mismatch or SQL syntax)');
  }
}
