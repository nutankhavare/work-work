import pool from "../src/lib/db";
import bcrypt from "bcryptjs";

async function run() {
  const client = await pool.connect();
  try {
    const email = 'jaincollege@gmail.com';
    const plainTextPassword = 'Jainjain@123';
    
    // Hash password with 10 salt rounds (standard, fast, secure)
    const hash = await bcrypt.hash(plainTextPassword, 10);
    console.log(`Generated hash for "${plainTextPassword}": ${hash}`);

    // Disable RLS temporarily to perform the update
    await client.query('ALTER TABLE vanloka.users DISABLE ROW LEVEL SECURITY');
    
    const updateRes = await client.query(
      `UPDATE vanloka.users SET password = $1 WHERE LOWER(email) = LOWER($2) RETURNING id, email, password`,
      [hash, email]
    );
    
    console.log("Update database response:", updateRes.rows);

    if (updateRes.rows.length > 0) {
      // Re-fetch and verify
      await client.query(`SET app.is_login_query = 'true'`);
      const { rows } = await client.query(
        `SELECT id, email, password FROM vanloka.users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [email]
      );
      const updatedUser = rows[0];
      const match = await bcrypt.compare(plainTextPassword, updatedUser.password);
      console.log(`Verification: Testing password "${plainTextPassword}" against new DB hash: ${match}`);
    } else {
      console.log(`Failed: User with email "${email}" was not updated.`);
    }

  } catch (err) {
    console.error("Error during password update:", err);
  } finally {
    try {
      await client.query('ALTER TABLE vanloka.users ENABLE ROW LEVEL SECURITY');
      await client.query(`RESET app.is_login_query`);
    } catch {}
    client.release();
    process.exit();
  }
}

run();
