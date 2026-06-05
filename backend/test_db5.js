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
    const res1 = await pool.query(`SELECT data_type FROM information_schema.columns WHERE table_schema='institute' AND table_name='institute_vehicles' AND column_name='id'`);
    console.log("Institute ID type:", res1.rows[0].data_type);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
