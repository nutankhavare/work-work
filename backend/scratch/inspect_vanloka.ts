import pool from "../src/lib/db";

async function inspect() {
  try {
    console.log("=== INSPECTING VANLOKA SCHEMA ===");
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'vanloka'
      ORDER BY table_name
    `);
    console.log("Tables in 'vanloka' schema:", tablesRes.rows.map(r => r.table_name));

    const publicTablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'organization%'
      ORDER BY table_name
    `);
    console.log("Organization-like tables in 'public' schema:", publicTablesRes.rows.map(r => r.table_name));

    // Let's also check if there is data in vanloka.organizations
    const orgs = await pool.query("SELECT * FROM vanloka.organizations LIMIT 1").catch(e => ({ error: e.message }));
    console.log("vanloka.organizations sample:", orgs);

  } catch (err: any) {
    console.error("Inspection failed:", err.message);
  } finally {
    await pool.end();
  }
}

inspect();
