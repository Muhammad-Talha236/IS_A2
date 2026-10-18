import { readFile } from 'node:fs/promises';
import { pool } from './db.js';
const schema = await readFile(new URL('../sql/schema.sql', import.meta.url),'utf8');
try { await pool.query(schema); console.log('UniAssess schema and seed data ready.'); }
catch (error) { console.error('Database setup failed:', error.message); process.exitCode=1; }
finally { await pool.end(); }
