const validMode = (mode) =>
  mode === 'vulnerable' || mode === 'safe';

export function checkMode(req, res) {
  if (!validMode(req.params.mode)) {
    res.status(404).json({ error: 'Unknown mode' });
    return false;
  }
  return true;
}

export const input = (value, max = 250) =>
  String(value ?? '').slice(0, max);

export function queryError(res, error, message) {
  // Keep diagnostics on the backend; never log submitted credentials.
  console.error('SQL lab query failed:', error.code || error.name);
  if (['42601', '42703', '42P10', '42804', '22001', '22003', '22P02', '25006', '57014'].includes(error.code)) {
    return res.status(400).json({ error: message });
  }
  if (error.code === '42P01') {
    return res.status(503).json({ error: 'Security-lab tables missing. Run npm run db:setup in backend.' });
  }
  return res.status(503).json({ error: 'Security-lab database unavailable. Check backend logs.' });
}

