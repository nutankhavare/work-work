import pool from "../src/lib/db";

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'institute' AND table_name = 'institute_vehicles'
      ORDER BY ordinal_position
    `);
    console.log("institute.institute_vehicles Columns:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit();
  }
}

run();
