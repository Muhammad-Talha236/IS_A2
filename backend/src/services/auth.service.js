import { pool } from '../db.js';
import { createSession, publicSession } from './session.service.js';
export async function establishSession(req, res, user, email, password) {
  // Determine bypass from a real parameterized comparison, never payload matching.
  const normal = await pool.query('SELECT id FROM lab_users WHERE id=$1 AND email=$2 AND password=$3', [user.id, email, password]);
  const profile = await pool.query('SELECT id FROM lab_profiles WHERE email=$1', ['demo.ta@cfd.nu.edu.pk']);
  if (!profile.rows.length) throw Object.assign(new Error('Missing fictional demo profile'), { code: '42P01' });
  const session = createSession(req, res, { user, mode: req.params.mode, bypassed: normal.rows.length === 0, profileId: profile.rows[0].id });
  return res.json(publicSession(session));
}
