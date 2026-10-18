import 'dotenv/config';
import pg from 'pg';
if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL. Copy .env.example to .env and configure PostgreSQL.');
  process.exit(1);
}
export const pool = new pg.Pool({connectionString:process.env.DATABASE_URL});
