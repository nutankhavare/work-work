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

const DEFAULT_PERMISSIONS = [
  "manage-fleet",
  "view-reports",
  "manage-staff",
  "manage-drivers",
  "manage-roles",
  "view-dashboard"
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log("🌱 Seeding permissions...");
    for (const name of DEFAULT_PERMISSIONS) {
      await client.query(
        "INSERT INTO institute.institute_permissions (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
        [name]
      );
    }
    console.log("✅ Seeding complete!");
  } catch (err: any) {
    console.error("❌ Seeding failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
