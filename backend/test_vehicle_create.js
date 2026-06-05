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
    const res = await pool.query(`
      INSERT INTO institute.institute_vehicles (org_id, vehicle_name, vehicle_number) 
      VALUES ('org123', 'Test Bus', 'KA01AB1234') RETURNING *
    `);
    console.log("Created:", res.rows[0]);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
