import pool from "../src/lib/db";

async function run() {
  const orgId = "60"; // Jain College org_id

  try {
    const result = await pool.query(`
      INSERT INTO institute.institute_ads (org_id, title, image, status)
      VALUES 
        ($1, 'Admission Open for 2026', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80', 'active'),
        ($1, 'Annual Tech Fest 2026', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', 'active')
      RETURNING *;
    `, [orgId]);

    console.log("Inserted ads:", result.rows);
  } catch (err) {
    console.error("Error inserting ads:", err);
  } finally {
    process.exit(0);
  }
}

run();
