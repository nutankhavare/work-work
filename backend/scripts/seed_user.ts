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

async function seed() {
  try {
    const email = 'git@institute.com';
    const password = 'Gitinstitute@123';
    const role = 'super_admin';
    const org_id = 1;

    // Check if user already exists
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length === 0) {
      // Disable RLS temporarily to insert
      await pool.query('ALTER TABLE users DISABLE ROW LEVEL SECURITY');
      await pool.query(
        'INSERT INTO users (email, password, role, org_id) VALUES ($1, $2, $3, $4)',
        [email, password, role, org_id]
      );
      await pool.query('ALTER TABLE users ENABLE ROW LEVEL SECURITY');
      console.log('User seeded successfully!');
    } else {
      console.log('User already exists. Updating password and role...');
      await pool.query('ALTER TABLE users DISABLE ROW LEVEL SECURITY');
      await pool.query(
        'UPDATE users SET password = $2, role = $3, org_id = $4 WHERE email = $1',
        [email, password, role, org_id]
      );
      await pool.query('ALTER TABLE users ENABLE ROW LEVEL SECURITY');
      console.log('User updated successfully!');
    }
  } catch (err) {
    console.error('Failed to seed user:', err);
  } finally {
    await pool.end();
  }
}

seed();
