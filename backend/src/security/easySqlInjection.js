import { checkMode, input, queryError } from '../utils/sql.js';
import { labQuery } from '../services/labQuery.js';
import { establishSession } from '../services/auth.service.js';

export async function login(req, res) {
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
      ? await labQuery(
          `${baseQuery}'${email}' AND password = '${password}' LIMIT 1`
        )
      : await labQuery(
          `${baseQuery}$1 AND password = $2 LIMIT 1`,
          [email, password]
        );

    if (!result.rows.length) {
      return res.status(401).json({
        authenticated: false,
        message: 'Invalid credentials'
      });
    }

    return await establishSession(req, res, result.rows[0], email, password);
  } catch (error) {
    return queryError(res, error, 'Invalid query or input');
  }
}
