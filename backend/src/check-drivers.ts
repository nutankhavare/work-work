import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

async function checkTables() {
  const client = await pool.connect();
  try {
    console.log("🔍 Checking tables in institute...\n");

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'schema1'
    `);
    
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'schema1' AND table_name = 'institute_drivers'
    `);
    console.log("\n--- Columns in institute_drivers ---");
    console.table(columns.rows);

    const driversCount = await client.query("SELECT COUNT(*) FROM institute.institute_drivers");
    console.log(`\nDrivers count: ${driversCount.rows[0].count}`);

    const sampleDrivers = await client.query("SELECT * FROM institute.institute_drivers LIMIT 2");
    console.log("\n--- Sample Drivers ---");
    console.table(sampleDrivers.rows);

  } catch (err: any) {
    console.error("❌ Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
