import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const res = await pool.query(`
    SELECT id, org_id, vehicle_name FROM institute.institute_vehicles LIMIT 10
  `);
  console.log("Vehicles:", res.rows);
  pool.end();
}
run();
