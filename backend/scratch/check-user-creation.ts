import pool from "../src/lib/db";

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, device_id, last_known_location FROM devices.gps WHERE device_id IN ('GPS-080', 'GPS-081')`
    );
    console.log("GPS Device Locations:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit();
  }
}

run();
