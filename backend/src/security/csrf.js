export function requireCsrf(req, res, next) {
  if (!req.authSession || req.get('x-csrf-token') !== req.authSession.csrfToken) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token' });
  }
  next();
}
