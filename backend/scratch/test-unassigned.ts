import pool from "../src/lib/db";

async function run() {
  try {
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

    const res = await pool.query(query, params);
    console.log("Unassigned drivers query result:", res.rows);
  } catch(e) {
    console.error("Query Error:", e);
  } finally {
    process.exit();
  }
}
run();
