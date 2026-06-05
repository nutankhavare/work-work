import { withRLS } from './src/lib/db.ts';

async function run() {
  try {
    const res = await withRLS('57', async (client) => {
      return client.query(`
        INSERT INTO institute.institute_vehicles 
        (id, org_id, vehicle_name, vehicle_number, status, gps_device_id)
        VALUES 
        (21, '57', 'Test Bus 21', 'KA02AA1002', 'active', 'GPS-TEST-1')
        ON CONFLICT (id) DO NOTHING
        RETURNING *;
      `);
    });
    console.log("Seeded Vehicle 21:", res.rows);
  } catch(e) {
    console.error(e);
  }
}
run();
