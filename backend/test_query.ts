import { withRLS } from './src/lib/db.ts';

async function run() {
  try {
    const res = await withRLS('57', async (client) => {
      return client.query(
        `SELECT id, vehicle_number, gps_device_id, assigned_driver_id FROM institute.institute_vehicles WHERE org_id = $1 AND vehicle_number = $2 LIMIT 1`,
        ['57', 'KA02AA1002']
      );
    });
    console.log("Found:", res.rows);
  } catch(e) {
    console.error(e);
  }
}
run();
