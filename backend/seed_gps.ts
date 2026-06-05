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
    const loc = JSON.stringify({ lat: 28.6139, lng: 77.2090, speed: 45 }); // New Delhi for demo
    await pool.query(
      `UPDATE devices.gps SET last_known_location = $1, last_ping = NOW() WHERE device_id = 'GPS-096'`,
      [loc]
    );
    console.log("Updated GPS-096 with New Delhi dummy coordinates.");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
