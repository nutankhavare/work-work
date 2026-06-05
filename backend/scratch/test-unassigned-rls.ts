import pool from "../src/lib/db";

async function run() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE institute.institute_drivers DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE institute.institute_vehicles DISABLE ROW LEVEL SECURITY');

    const orgId = '59';
    const currentAssignedId = '';
    
    let query = `
      SELECT d.id, d.first_name, d.last_name, d.employee_id 
      FROM institute.institute_drivers d
      WHERE d.org_id = $1 
        AND (
          d.id::text NOT IN (
            SELECT assigned_driver_id FROM institute.institute_vehicles 
            WHERE org_id = $1 AND assigned_driver_id IS NOT NULL
          )
    `;
    const params = [String(orgId)];
    
    if (currentAssignedId) {
      query += ` OR d.id::text = $2`;
      params.push(currentAssignedId);
    }
    
    query += `) ORDER BY d.first_name ASC`;

    const res = await client.query(query, params);
    console.log("Unassigned drivers query result (No RLS):", res.rows);
  } catch(e) {
    console.error("Query Error:", e);
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
