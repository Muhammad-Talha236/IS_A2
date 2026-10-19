import crypto from 'node:crypto';
export const sessions = new Map();
export const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 4 * 60 * 60 * 1000 };
export function sessionId(req) {
  return (req.headers.cookie || '').split(';').map(p => p.trim()).find(p => p.startsWith('ua_session='))?.slice(11);
}
export function createSession(req, res, details) {
  sessions.delete(sessionId(req));
  for (const [id, session] of sessions) if (session.expiresAt <= Date.now()) sessions.delete(id);
  const id = crypto.randomBytes(24).toString('hex');
  const session = { ...details, csrfToken: crypto.randomBytes(32).toString('hex'), expiresAt: Date.now() + cookieOptions.maxAge };
  sessions.set(id, session);
  res.cookie('ua_session', id, cookieOptions);
  return session;
}
export const publicSession = session => ({ authenticated: true, user: session.user, mode: session.mode, bypassed: session.bypassed, csrfToken: session.csrfToken });
