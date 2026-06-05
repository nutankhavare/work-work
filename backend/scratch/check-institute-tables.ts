import pool from "../src/lib/db";

async function run() {
  const client = await pool.connect();
  try {
    // Check institute_gps columns
    const gpsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'institute' AND table_name = 'institute_gps'
      ORDER BY ordinal_position
    `);
    console.log("=== institute.institute_gps columns ===");
    gpsColumns.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`));

    // Check institute_beacon columns
    const beaconColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'institute' AND table_name = 'institute_beacon'
      ORDER BY ordinal_position
    `);
    console.log("\n=== institute.institute_beacon columns ===");
    beaconColumns.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`));

    // Check devices.gps columns
    const devGpsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'devices' AND table_name = 'gps'
      ORDER BY ordinal_position
    `);
    console.log("\n=== devices.gps columns ===");
    devGpsColumns.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`));

    // Check devices.beacons columns
    const devBeaconColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'devices' AND table_name = 'beacons'
      ORDER BY ordinal_position
    `);
    console.log("\n=== devices.beacons columns ===");
    devBeaconColumns.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`));

    // Check current data in devices tables
    const gpsCount = await client.query(`SELECT COUNT(*) as cnt FROM devices.gps`);
    const beaconCount = await client.query(`SELECT COUNT(*) as cnt FROM devices.beacons`);
    const instGpsCount = await client.query(`SELECT COUNT(*) as cnt FROM institute.institute_gps`);
    const instBeaconCount = await client.query(`SELECT COUNT(*) as cnt FROM institute.institute_beacon`);
    console.log(`\n=== Row counts ===`);
    console.log(`  devices.gps: ${gpsCount.rows[0].cnt}`);
    console.log(`  devices.beacons: ${beaconCount.rows[0].cnt}`);
    console.log(`  institute.institute_gps: ${instGpsCount.rows[0].cnt}`);
    console.log(`  institute.institute_beacon: ${instBeaconCount.rows[0].cnt}`);

    // Check a sample from devices.gps
    const sampleGps = await client.query(`SELECT * FROM devices.gps LIMIT 2`);
    console.log("\n=== Sample devices.gps ===");
    sampleGps.rows.forEach(r => console.log(JSON.stringify(r)));

    // Check a sample from devices.beacons
    const sampleBeacons = await client.query(`SELECT * FROM devices.beacons LIMIT 2`);
    console.log("\n=== Sample devices.beacons ===");
    sampleBeacons.rows.forEach(r => console.log(JSON.stringify(r)));

  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(e => { console.error(e); process.exit(1); });
