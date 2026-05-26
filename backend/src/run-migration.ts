import "dotenv/config";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

const pool = new Pool({
  host: process.env.PGHOST || "vanloka-postgres.postgres.database.azure.com",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "vanloka_admin",
  password: process.env.PGPASSWORD || "MyNewPass@123",
  database: process.env.PGDATABASE || "postgres",
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const sqlPath = join(import.meta.dir, "..", "migrations", "001_create_schema1_tables.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  console.log("🔗 Connecting to Azure PostgreSQL...");

  const client = await pool.connect();
  try {
    console.log("✅ Connected! Running migration...\n");
    await client.query(sql);
    console.log("✅ Migration completed successfully!");

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'schema1' 
      ORDER BY table_name
    `);

    console.log(`\n📋 Tables created in schema1:`);
    for (const row of result.rows) {
      console.log(`   - institute.${row.table_name}`);
    }
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
