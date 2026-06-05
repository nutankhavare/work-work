import pool from "../src/lib/db";
import bcrypt from "bcryptjs";

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`SET app.is_login_query = 'true'`);

    const { rows } = await client.query(
      `SELECT id, email, password, role FROM users`
    );

    const passwords = [
      "Gitinstitute@123",
      "gitinstitute@123",
      "Gitinstitute",
      "gitinstitute",
      "admin",
      "admin123",
      "password",
      "password123",
      "123456",
      "Jaincollege@123",
      "jaincollege@123",
      "Jaincollege",
      "jaincollege",
      "Jainjain@123",
      "jainjain@123",
      "JainJain@123",
      "Jainjain",
      "jainjain",
      "Jain@123",
      "jain@123",
      "Jainjain123",
      "jainjain123"
    ];

    for (const user of rows) {
      for (const pw of passwords) {
        let match = false;
        if (user.password?.startsWith("$2")) {
          match = await bcrypt.compare(pw, user.password);
        } else {
          match = pw === user.password;
        }
        if (match) {
          console.log(`>>> MATCH: User "${user.email}" matches password "${pw}"`);
        }
      }
    }
    console.log("Done checking common passwords.");
  } catch (err) {
    console.error(err);
  } finally {
    try {
      await client.query(`RESET app.is_login_query`);
    } catch {}
    client.release();
    process.exit();
  }
}

run();
