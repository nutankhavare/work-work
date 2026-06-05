import pool from "../src/lib/db";

async function run() {
  const client = await pool.connect();
  try {
    const orgId = 60;
    const gpsRes = await client.query(
      `SELECT id, device_id, org_id, assigned_to, assigned_type FROM devices.gps WHERE org_id = $1`,
      [orgId]
    );
    console.log(`GPS devices for org ${orgId}:`, gpsRes.rows);

    const beaconRes = await client.query(
      `SELECT id, device_id, org_id, assigned_to, assigned_type FROM devices.beacons WHERE org_id = $1`,
      [orgId]
    );
    console.log(`Beacon devices for org ${orgId}:`, beaconRes.rows);

    // Let's print unique org_ids in the devices table
    const uniqueGpsOrgs = await client.query(`SELECT DISTINCT org_id FROM devices.gps`);
    console.log("Unique orgs in devices.gps:", uniqueGpsOrgs.rows.map(r => r.org_id));

    const uniqueBeaconOrgs = await client.query(`SELECT DISTINCT org_id FROM devices.beacons`);
    console.log("Unique orgs in devices.beacons:", uniqueBeaconOrgs.rows.map(r => r.org_id));

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit();
  }
}

run();
