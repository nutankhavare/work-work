import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`SELECT relforcerowsecurity FROM pg_class WHERE relname = 'institute_vehicles'`);
    console.log("Force RLS:", res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
