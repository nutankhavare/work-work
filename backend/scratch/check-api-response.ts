import pool from "../src/lib/db";

// Mock the backend handler logic to see what it returns for org_id = 59
async function simulateEndpoint() {
  const orgId = '59';
  const currentAssignedId = '';
  
  try {
    const data = await withTransaction("GET /api/drivers/unassigned", orgId, async (client) => {
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
      
      const result = await client.query(query, params);
      return result.rows;
    });

    console.log("Endpoint output for Org 59:", data);
  } catch (err) {
    console.error("Endpoint simulation failed:", err);
  } finally {
    process.exit();
  }
}

// Replicate server.ts's withTransaction
async function withTransaction(
  routeName: string,
  orgId: string,
  callback: (client: any) => Promise<any>
): Promise<any> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SELECT set_config('app.current_org_id', $1, true)`, [orgId]);
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

simulateEndpoint();
