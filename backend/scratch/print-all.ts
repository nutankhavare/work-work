import pool from "../src/lib/db";

async function run() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE institute.institute_drivers DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE institute.institute_vehicles DISABLE ROW LEVEL SECURITY');

    const drivers = await client.query('SELECT id, org_id, first_name, last_name, vehicle, beacon_id FROM institute.institute_drivers');
    console.log("All Drivers:", drivers.rows);

    const vehicles = await client.query('SELECT id, org_id, vehicle_number, status, assigned_driver_id FROM institute.institute_vehicles');
    console.log("All Vehicles:", vehicles.rows);
  } catch(e) {
    console.error(e);
  } finally {
    try {
      await client.query('ALTER TABLE institute.institute_drivers ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE institute.institute_vehicles ENABLE ROW LEVEL SECURITY');
    } catch {}
    client.release();
    process.exit();
  }
}
run();
