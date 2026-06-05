import pool from "../src/lib/db";

async function run() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE institute.institute_gps DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE institute.institute_beacon DISABLE ROW LEVEL SECURITY');

    const gpsRes = await client.query('SELECT * FROM devices.gps WHERE org_id = 60 LIMIT 5');
    console.log("devices.gps rows:", gpsRes.rows);

    const beaconRes = await client.query('SELECT * FROM devices.beacons WHERE org_id = 60 LIMIT 5');
    console.log("devices.beacons rows:", beaconRes.rows);

    const instGpsRes = await client.query('SELECT * FROM institute.institute_gps WHERE allocated_to_org = 60 LIMIT 5');
    console.log("institute.institute_gps rows (org 60):", instGpsRes.rows);

    const instBeaconRes = await client.query('SELECT * FROM institute.institute_beacon WHERE allocated_to_org = 60 LIMIT 5');
    console.log("institute.institute_beacon rows (org 60):", instBeaconRes.rows);
  } catch(e) {
    console.error(e);
  } finally {
    try {
      await client.query('ALTER TABLE institute.institute_gps ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE institute.institute_beacon ENABLE ROW LEVEL SECURITY');
    } catch {}
    client.release();
    process.exit();
  }
}
run();
