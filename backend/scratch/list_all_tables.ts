import pool from "../src/lib/db";

async function list() {
  try {
    const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);
    console.log("=== ALL TABLES IN DATABASE ===");
    console.table(res.rows);
  } catch (err: any) {
    console.error("Failed to list tables:", err.message);
  } finally {
    await pool.end();
  }
}

list();
