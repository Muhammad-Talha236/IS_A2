import { pool } from '../db.js';
// Each injectable demonstration is a single read-only PostgreSQL statement.
export async function labQuery(text, values) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout = '3s'");
    const result = await client.query({ text, values, queryMode: 'extended' });
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
