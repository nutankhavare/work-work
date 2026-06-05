import pool from "../src/lib/db";

async function test() {
  try {
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log("Users Columns:", cols.rows);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit();
  }
}

test();
