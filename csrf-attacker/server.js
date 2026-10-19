// Separate local origin for a real browser form-based CSRF demonstration.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
http.createServer((req, res) => {
  if (req.url !== '/') { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
}).listen(4100, '127.0.0.1', () => console.log('Local attacker page: http://127.0.0.1:4100'));
