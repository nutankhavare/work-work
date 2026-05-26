import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

async function research() {
  try {
    // 1. Look for schemas
    const schemas = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name ILIKE '%mds%'");
    console.log("--- SCHEMAS ---");
    console.table(schemas.rows);

    // 2. Look for tables
    const tables = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE '%mds%' OR table_schema ILIKE '%mds%'");
    console.log("--- TABLES ---");
    console.table(tables.rows);

    // 3. Check for any 'mds' users in the `vanloka.users` table
    // Assuming vanloka is the default schema or we query it explicitly
    const users = await pool.query("SELECT id, email, role, org_id FROM vanloka.users WHERE email ILIKE '%mds%' OR role ILIKE '%mds%'");
    console.log("--- USERS ---");
    console.table(users.rows);

    // 4. Check for multiple schemas just to be thorough
    const allSchemas = await pool.query("SELECT schema_name FROM information_schema.schemata");
    console.log("--- ALL SCHEMAS ---");
    const sysSchemas = ['pg_catalog', 'information_schema', 'pg_toast'];
    const customSchemas = allSchemas.rows.filter(r => !sysSchemas.includes(r.schema_name) && !r.schema_name.startsWith('pg_'));
    console.table(customSchemas);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

research();
