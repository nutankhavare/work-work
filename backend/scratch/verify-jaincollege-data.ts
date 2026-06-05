import pool from "../src/lib/db";

async function run() {
  const client = await pool.connect();
  try {
    const orgId = '60';
    console.log(`Setting session app.current_org_id = '${orgId}' to verify RLS...`);
    await client.query(`SELECT set_config('app.current_org_id', $1, false)`, [orgId]);

    // Query vehicles
    const vehicles = await client.query(
      `SELECT id, org_id, vehicle_number, gps_device_id, assigned_driver_id FROM institute.institute_vehicles`
    );
    console.log("Verified Vehicles under RLS:", vehicles.rows);

    // Query drivers
    const drivers = await client.query(
      `SELECT id, org_id, first_name, last_name, beacon_id FROM institute.institute_drivers`
    );
    console.log("Verified Drivers under RLS:", drivers.rows);

    // Query employees
    const employees = await client.query(
      `SELECT id, org_id, first_name, last_name, beacon_id FROM institute.institute_employees`
    );
    console.log("Verified Employees/Staff under RLS:", employees.rows);

    // Query institute GPS
    const instGps = await client.query(
      `SELECT id, device_id, allocated_to_org, assigned_to, assigned_type FROM institute.institute_gps`
    );
    console.log("Verified institute_gps under RLS:", instGps.rows);

    // Query institute Beacons
    const instBeacons = await client.query(
      `SELECT id, device_id, allocated_to_org, assigned_to, assigned_type FROM institute.institute_beacon`
    );
    console.log("Verified institute_beacon under RLS:", instBeacons.rows);

  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    try {
      await client.query(`SELECT set_config('app.current_org_id', '', false)`);
    } catch {}
    client.release();
    process.exit();
  }
}

run();
