export function errorHandler(error, _req, res, _next) {
  console.error('API error:', error.code || error.type || error.name, error.message);
  const status = error.status || (error.code === '42P01' ? 503 : 500);
  res.status(status).json({ error: status === 503 ? 'Lab schema missing. Run npm run db:setup.' : status < 500 ? error.message : 'Server error; see backend logs' });
}
