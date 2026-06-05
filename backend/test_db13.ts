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
    await pool.query(`ALTER TABLE institute.institute_vehicles NO FORCE ROW LEVEL SECURITY`);
    const res = await pool.query(`SELECT id, org_id, vehicle_number FROM institute.institute_vehicles`);
    console.log("All Vehicles:", res.rows);
    await pool.query(`ALTER TABLE institute.institute_vehicles FORCE ROW LEVEL SECURITY`);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
