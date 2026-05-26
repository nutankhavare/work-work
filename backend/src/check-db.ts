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

async function checkData() {
  const client = await pool.connect();
  try {
    console.log("🔍 Checking latest data in institute...\n");

    // Check Roles
    const roles = await client.query("SELECT id, name, description FROM institute.institute_roles ORDER BY id DESC LIMIT 5");
    console.log("--- Latest 5 Roles ---");
    console.table(roles.rows.length ? roles.rows : [{ message: "No roles found" }]);
    console.log("\n");

    // Check Employees/Staff
    const staff = await client.query("SELECT id, first_name, last_name, designation, email FROM institute.institute_employees ORDER BY id DESC LIMIT 5");
    console.log("--- Latest 5 Staff Members ---");
    console.table(staff.rows.length ? staff.rows : [{ message: "No staff found" }]);
    console.log("\n");

  } catch (err: any) {
    console.error("❌ Error querying database:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkData();
