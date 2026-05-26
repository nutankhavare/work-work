const { Client } = require('pg');
const client = new Client({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'institute_panel',
  password: process.env.PGPASSWORD || 'MyNewPass@123',
  port: process.env.PGPORT || 5432,
});
client.connect()
  .then(() => client.query('SELECT email, password FROM users LIMIT 10'))
  .then(res => { console.log("users table:", res.rows); return client.query('SELECT email, password FROM schema1.institute_users LIMIT 10').catch(e => { console.log("schema1.institute_users does not exist or error:", e.message); return {rows: []}; }); })
  .then(res => { console.log("institute_users table:", res.rows); client.end(); })
  .catch(e => { console.error(e); client.end(); });
