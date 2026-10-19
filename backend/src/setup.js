import { readFile } from 'node:fs/promises';
import { pool } from './db.js';
const files = ['schema.sql', 'security_lab.sql'];
let client;
try {
  client = await pool.connect();
  await client.query('BEGIN');
  for (const file of files) {
    const sql = await readFile(new URL(`../sql/${file}`, import.meta.url), 'utf8');
    await client.query(sql);
  }
  await client.query('COMMIT');
  console.log('UniAssess schema and security-lab seed data ready.');
}
catch (error) {
  if (client) await client.query('ROLLBACK');
  console.error('Database setup failed:', error.message);
  process.exitCode=1;
}
finally {
  client?.release();
  await pool.end();
}
