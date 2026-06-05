import pool from "../src/lib/db";

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_name, column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'institute' AND table_name IN ('institute_vehicles', 'institute_drivers', 'institute_employees') AND column_name = 'id'
    `);
    console.log("ID column definitions:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit();
  }
}

run();
