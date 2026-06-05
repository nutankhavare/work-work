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
    await pool.query('ALTER TABLE institute.institute_vehicles NO FORCE ROW LEVEL SECURITY');
    
    // Find the latest vehicle created
    const vehicleRes = await pool.query('SELECT * FROM institute.institute_vehicles ORDER BY id DESC LIMIT 1');
    const vehicle = vehicleRes.rows[0];
    console.log("Latest Vehicle:", vehicle);

    if (vehicle && vehicle.gps_device_id) {
      const gpsRes = await pool.query('SELECT * FROM devices.gps WHERE device_id = $1', [vehicle.gps_device_id]);
      console.log("GPS Device Details:", gpsRes.rows[0]);
    }

    await pool.query('ALTER TABLE institute.institute_vehicles FORCE ROW LEVEL SECURITY');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
