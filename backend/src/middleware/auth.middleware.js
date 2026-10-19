import { sessions, sessionId } from '../services/session.service.js';
export function requireAuth(req, res, next) {
  const id = sessionId(req);
  const session = sessions.get(id);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(id);
    return res.status(401).json({ error: 'Sign in to continue' });
  }
  let path;
  try { path = decodeURIComponent(req.path); }
  catch { return res.status(400).json({ error: 'Invalid request path' }); }
  const routeMode = path.match(/^\/(?:sql\/|lab\/)?(safe|vulnerable)(?:\/|$)/)?.[1];
  const requestedMode = req.get('x-security-mode') || routeMode;
  if ((requestedMode && requestedMode !== session.mode) || (routeMode && routeMode !== session.mode)) {
    return res.status(401).json({ error: 'Mode changed. Sign in again in the selected mode.' });
  }
  req.authSession = session;
  req.demoSession = session;
  next();
}
