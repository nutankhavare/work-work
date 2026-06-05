import pool from "../src/lib/db";

async function run() {
  const client = await pool.connect();
  try {
    const orgId = '60';
    
    // Disable RLS temporarily to check everything
    await client.query('ALTER TABLE institute.institute_vehicles DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE institute.institute_drivers DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE institute.institute_employees DISABLE ROW LEVEL SECURITY');

    const vehicles = await client.query(
      `SELECT id, org_id, vehicle_number, status, gps_device_id FROM institute.institute_vehicles WHERE org_id = $1`,
      [orgId]
    );
    console.log("Vehicles for org 60:", vehicles.rows);

    const drivers = await client.query(
      `SELECT id, org_id, first_name, last_name, beacon_id FROM institute.institute_drivers WHERE org_id = $1`,
      [orgId]
    );
    console.log("Drivers for org 60:", drivers.rows);

    const employees = await client.query(
      `SELECT id, org_id, first_name, last_name, beacon_id, roles FROM institute.institute_employees WHERE org_id = $1`,
      [orgId]
    );
    console.log("Employees/Staff for org 60:", employees.rows);

  } catch (err) {
    console.error(err);
  } finally {
    try {
      await client.query('ALTER TABLE institute.institute_vehicles ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE institute.institute_drivers ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE institute.institute_employees ENABLE ROW LEVEL SECURITY');
    } catch {}
    client.release();
    process.exit();
  }
}

run();
