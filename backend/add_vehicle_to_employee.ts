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
    await pool.query(`ALTER TABLE institute.institute_employees ADD COLUMN IF NOT EXISTS assigned_vehicle_id INTEGER;`);
    console.log("Column added successfully.");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
