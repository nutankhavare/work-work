import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.PGHOST || "vanloka-postgres.postgres.database.azure.com",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "vanloka_admin",
  password: process.env.PGPASSWORD || "MyNewPass@123",
  database: process.env.PGDATABASE || "postgres",
  ssl: { rejectUnauthorized: false },
});

async function migrateRoles() {
  const client = await pool.connect();
  try {
    console.log("Migration started...");
    
    await client.query("BEGIN");
    
    // 1. Add jsonb permissions array to roles table (if it doesn't exist)
    await client.query(`
      ALTER TABLE institute.institute_roles 
      ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
    `);

    // 2. Drop the junction table and permissions table 
    await client.query(`DROP TABLE IF EXISTS institute.institute_role_permissions CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS institute.institute_permissions CASCADE;`);

    await client.query("COMMIT");
    console.log("Migration successful! Merged into one institute_roles table.");
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateRoles();
