import pool from "../src/lib/db";

async function run() {
  try {
    const schemas = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('devices', 'institute', 'public')
      ORDER BY table_schema, table_name
    `);
    console.log("Tables in DB:", schemas.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
