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
    // Check if there are ANY records in office.office_vehicles
    const res2 = await pool.query(`SELECT id, org_id FROM office.office_vehicles LIMIT 5`);
    console.log("Office Vehicles:", res2.rows);
  } catch(e) {
    console.error("Office error:", e.message);
  }

  try {
    // Check mds_vehicles
    const res3 = await pool.query(`SELECT id, org_id FROM mds.mds_vehicles LIMIT 5`);
    console.log("MDS Vehicles:", res3.rows);
  } catch(e) {
    console.error("MDS error:", e.message);
  }

  pool.end();
}
run();
