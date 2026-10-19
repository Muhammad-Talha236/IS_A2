import { pool } from '../db.js';
import { validRecoveryEmail, isMode } from '../utils/input.js';
export async function profileSession(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT id,name,email,recovery_email FROM lab_profiles WHERE id=$1', [req.authSession.profileId]);
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json({ message: 'Demo session ready', profile: rows[0], csrfToken: req.authSession.csrfToken });
  } catch (error) { next(error); }
}
export async function getProfile(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT id,name,email,recovery_email FROM lab_profiles WHERE id=$1', [req.authSession.profileId]);
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json(rows[0]);
  } catch (error) { next(error); }
}
export async function updateRecoveryEmail(req, res, next) {
  if (!isMode(req.params.mode)) return res.status(404).json({ error: 'Unknown mode' });
  const email = String(req.body?.recoveryEmail ?? '').trim();
  if (!validRecoveryEmail(email)) return res.status(400).json({ error: 'Invalid recovery email' });
  try {
    const { rows } = await pool.query('UPDATE lab_profiles SET recovery_email=$1 WHERE id=$2 RETURNING id,name,email,recovery_email', [email, req.authSession.profileId]);
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json({ message: 'Recovery email updated', profile: rows[0] });
  } catch (error) { next(error); }
}
