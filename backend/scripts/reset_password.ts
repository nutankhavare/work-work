import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

async function resetPassword() {
  try {
    const email = 'git@institute.com';
    const newPass = 'Gitinstitute@123';
    const hash = await bcrypt.hash(newPass, 10);
    
    // Disable RLS temporarily to update just in case
    await pool.query('ALTER TABLE users DISABLE ROW LEVEL SECURITY');
    
    const res = await pool.query('UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email', [hash, email]);
    
    await pool.query('ALTER TABLE users ENABLE ROW LEVEL SECURITY');
    
    console.log("Updated password for users:", res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

resetPassword();
