import { sessions, sessionId, cookieOptions, publicSession } from '../services/session.service.js';
export { login } from '../security/easySqlInjection.js';
export const currentSession = (req, res) => res.json(publicSession(req.authSession));
export function logout(req, res) {
  sessions.delete(sessionId(req));
  res.clearCookie('ua_session', { ...cookieOptions, maxAge: undefined });
  res.json({ message: 'Signed out' });
}
