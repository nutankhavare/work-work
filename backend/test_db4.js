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
    const res1 = await pool.query(`SELECT id FROM institute.institute_vehicles WHERE id = 21`);
    const res2 = await pool.query(`SELECT id FROM office.office_vehicles WHERE id = 21`);
    const res3 = await pool.query(`SELECT id FROM mds.mds_vehicles WHERE id = 21`);
    console.log("Institute:", res1.rows);
    console.log("Office:", res2.rows);
    console.log("MDS:", res3.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
