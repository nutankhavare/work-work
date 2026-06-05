import pool from "../src/lib/db";

async function run() {
  const client = await pool.connect();
  try {
    const orgId = 60;

    console.log("Starting seeding for org_id 60...");

    // Disable Row Level Security on all tables
    await client.query('ALTER TABLE institute.institute_vehicles DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE institute.institute_drivers DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE institute.institute_employees DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE institute.institute_gps DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE institute.institute_beacon DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE institute.institute_compliance DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE devices.gps DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE devices.beacons DISABLE ROW LEVEL SECURITY');

    // 1. Clear any existing records for this org just in case to avoid duplicates
    console.log("Clearing any existing data for org 60...");
    await client.query('DELETE FROM institute.institute_vehicles WHERE org_id = $1', [orgId]);
    await client.query('DELETE FROM institute.institute_drivers WHERE org_id = $1', [orgId]);
    await client.query('DELETE FROM institute.institute_employees WHERE org_id = $1', [orgId]);
    await client.query('DELETE FROM institute.institute_gps WHERE allocated_to_org = $1', [orgId]);
    await client.query('DELETE FROM institute.institute_beacon WHERE allocated_to_org = $1', [orgId]);
    await client.query('DELETE FROM institute.institute_compliance WHERE org_id = $1', [String(orgId)]);
    await client.query("UPDATE devices.gps SET assigned_to = NULL, assigned_type = NULL WHERE org_id = $1", [orgId]);
    await client.query("UPDATE devices.beacons SET assigned_to = NULL, assigned_type = NULL WHERE org_id = $1", [orgId]);

    // 2. Insert Vehicles
    console.log("Inserting vehicles...");
    const v1Res = await client.query(
      `INSERT INTO institute.institute_vehicles (
         org_id, vehicle_number, status, manufacturer, vehicle_model, seating_capacity, fuel_type,
         insurance_expiry_date, fitness_expiry_date, pollution_expiry_date, permit_expiry_date
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [orgId, 'KA-02-J-1234', 'active', 'Tata', 'Bus Star', 40, 'Diesel', '2027-06-15', '2027-12-20', '2026-11-10', '2028-03-05']
    );
    const vehicle1Id = v1Res.rows[0].id;

    const v2Res = await client.query(
      `INSERT INTO institute.institute_vehicles (
         org_id, vehicle_number, status, manufacturer, vehicle_model, seating_capacity, fuel_type,
         insurance_expiry_date, fitness_expiry_date, pollution_expiry_date, permit_expiry_date
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [orgId, 'KA-02-J-5678', 'active', 'Ashok Leyland', 'Vikram', 50, 'CNG', '2026-05-01', '2026-04-10', '2026-07-15', '2026-03-15']
    );
    const vehicle2Id = v2Res.rows[0].id;

    console.log(`Inserted Vehicles: V1=${vehicle1Id}, V2=${vehicle2Id}`);

    // 3. Insert Drivers
    console.log("Inserting drivers...");
    const d1Res = await client.query(
      `INSERT INTO institute.institute_drivers (org_id, first_name, last_name, mobile_number, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [orgId, 'Rajesh', 'Patil', '9876543210', 'active']
    );
    const driver1Id = d1Res.rows[0].id;

    const d2Res = await client.query(
      `INSERT INTO institute.institute_drivers (org_id, first_name, last_name, mobile_number, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [orgId, 'Suresh', 'Gowda', '9876543211', 'active']
    );
    const driver2Id = d2Res.rows[0].id;

    console.log(`Inserted Drivers: D1=${driver1Id}, D2=${driver2Id}`);

    // 4. Insert Employees/Staff
    console.log("Inserting employees...");
    const e1Res = await client.query(
      `INSERT INTO institute.institute_employees (org_id, first_name, last_name, employee_id, status, roles)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [orgId, 'Asha', 'Kulkarni', 'EMP-101', 'active', JSON.stringify(['Staff'])]
    );
    const employee1Id = e1Res.rows[0].id;

    const e2Res = await client.query(
      `INSERT INTO institute.institute_employees (org_id, first_name, last_name, employee_id, status, roles)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [orgId, 'Vikram', 'Rathore', 'EMP-102', 'active', JSON.stringify(['Staff'])]
    );
    const employee2Id = e2Res.rows[0].id;

    console.log(`Inserted Employees: E1=${employee1Id}, E2=${employee2Id}`);

    // Link drivers to vehicles
    await client.query(
      `UPDATE institute.institute_vehicles SET assigned_driver_id = $1 WHERE id = $2`,
      [driver1Id, vehicle1Id]
    );
    await client.query(
      `UPDATE institute.institute_vehicles SET assigned_driver_id = $1 WHERE id = $2`,
      [driver2Id, vehicle2Id]
    );

    // 5. Query the allocated GPS and Beacon details from devices schema
    console.log("Fetching central device details...");
    const gpsDevices = await client.query(`SELECT * FROM devices.gps WHERE org_id = $1`, [orgId]);
    const beaconDevices = await client.query(`SELECT * FROM devices.beacons WHERE org_id = $1`, [orgId]);

    const gps080 = gpsDevices.rows.find(g => g.device_id === 'GPS-080');
    const gps081 = gpsDevices.rows.find(g => g.device_id === 'GPS-081');

    const beacon011 = beaconDevices.rows.find(b => b.device_id === 'BEACON-011');
    const beacon012 = beaconDevices.rows.find(b => b.device_id === 'BEACON-012');
    const beacon013 = beaconDevices.rows.find(b => b.device_id === 'BEACON-013');

    if (!gps080 || !gps081 || !beacon011 || !beacon012 || !beacon013) {
      throw new Error("Missing some expected GPS or Beacon devices in central registry for org 60.");
    }

    // 6. Assign GPS to vehicles
    console.log("Updating vehicles with GPS assignments...");
    await client.query(
      `UPDATE institute.institute_vehicles SET gps_device_id = $1 WHERE id = $2`,
      ['GPS-080', vehicle1Id]
    );
    await client.query(
      `UPDATE institute.institute_vehicles SET gps_device_id = $1 WHERE id = $2`,
      ['GPS-081', vehicle2Id]
    );

    // 7. Assign Beacons to drivers and staff
    console.log("Updating drivers and staff with Beacon assignments...");
    await client.query(
      `UPDATE institute.institute_drivers SET beacon_id = $1 WHERE id = $2`,
      ['BEACON-011', driver1Id]
    );
    await client.query(
      `UPDATE institute.institute_drivers SET beacon_id = $1 WHERE id = $2`,
      ['BEACON-013', driver2Id]
    );
    await client.query(
      `UPDATE institute.institute_employees SET beacon_id = $1 WHERE id = $2`,
      ['BEACON-012', employee1Id]
    );

    // 8. Insert into institute.institute_gps
    console.log("Inserting GPS assignments into institute_gps...");
    await client.query(
      `INSERT INTO institute.institute_gps (
         id, device_id, sim_number, network_provider, device_health, status,
         allocated_to_org, is_active, assigned_to, assigned_type, last_known_location, last_ping, synced_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [gps080.id, 'GPS-080', gps080.sim_number, gps080.network_provider, gps080.device_health, gps080.status, orgId, true, String(vehicle1Id), 'vehicle', JSON.stringify({ lat: 12.9716, lng: 77.5946, speed: 25 })]
    );
    await client.query(
      `INSERT INTO institute.institute_gps (
         id, device_id, sim_number, network_provider, device_health, status,
         allocated_to_org, is_active, assigned_to, assigned_type, last_known_location, last_ping, synced_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [gps081.id, 'GPS-081', gps081.sim_number, gps081.network_provider, gps081.device_health, gps081.status, orgId, true, String(vehicle2Id), 'vehicle', JSON.stringify({ lat: 12.9916, lng: 77.6146, speed: 35 })]
    );

    // 9. Insert into institute.institute_beacon
    console.log("Inserting Beacon assignments into institute_beacon...");
    await client.query(
      `INSERT INTO institute.institute_beacon (
         id, device_id, sequence_id, allocated_to_org, status, device_type,
         manufactured_at, manufactured_by, warranty_years, warranty_expiry,
         battery_level, battery_status, battery_type, expected_battery_life_days,
         device_health, is_active, created_at, assigned_to, assigned_type, synced_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())`,
      [
        beacon011.id, 'BEACON-011', beacon011.sequence_id, orgId, beacon011.status, beacon011.device_type,
        beacon011.manufactured_at, beacon011.manufactured_by, beacon011.warranty_years, beacon011.warranty_expiry,
        beacon011.battery_level, beacon011.battery_status, beacon011.battery_type, beacon011.expected_battery_life_days,
        beacon011.device_health, beacon011.is_active, beacon011.created_at, String(driver1Id), 'driver'
      ]
    );
    await client.query(
      `INSERT INTO institute.institute_beacon (
         id, device_id, sequence_id, allocated_to_org, status, device_type,
         manufactured_at, manufactured_by, warranty_years, warranty_expiry,
         battery_level, battery_status, battery_type, expected_battery_life_days,
         device_health, is_active, created_at, assigned_to, assigned_type, synced_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())`,
      [
        beacon012.id, 'BEACON-012', beacon012.sequence_id, orgId, beacon012.status, beacon012.device_type,
        beacon012.manufactured_at, beacon012.manufactured_by, beacon012.warranty_years, beacon012.warranty_expiry,
        beacon012.battery_level, beacon012.battery_status, beacon012.battery_type, beacon012.expected_battery_life_days,
        beacon012.device_health, beacon012.is_active, beacon012.created_at, String(employee1Id), 'staff'
      ]
    );
    await client.query(
      `INSERT INTO institute.institute_beacon (
         id, device_id, sequence_id, allocated_to_org, status, device_type,
         manufactured_at, manufactured_by, warranty_years, warranty_expiry,
         battery_level, battery_status, battery_type, expected_battery_life_days,
         device_health, is_active, created_at, assigned_to, assigned_type, synced_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())`,
      [
        beacon013.id, 'BEACON-013', beacon013.sequence_id, orgId, beacon013.status, beacon013.device_type,
        beacon013.manufactured_at, beacon013.manufactured_by, beacon013.warranty_years, beacon013.warranty_expiry,
        beacon013.battery_level, beacon013.battery_status, beacon013.battery_type, beacon013.expected_battery_life_days,
        beacon013.device_health, beacon013.is_active, beacon013.created_at, String(driver2Id), 'driver'
      ]
    );

    // 10. Also sync assignment details to central devices registry for consistency
    console.log("Syncing assignments to central devices tables...");
    await client.query(
      `UPDATE devices.gps SET assigned_to = $1, assigned_type = $2 WHERE id = $3`,
      [String(vehicle1Id), 'vehicle', gps080.id]
    );
    await client.query(
      `UPDATE devices.gps SET assigned_to = $1, assigned_type = $2 WHERE id = $3`,
      [String(vehicle2Id), 'vehicle', gps081.id]
    );
    await client.query(
      `UPDATE devices.beacons SET assigned_to = $1, assigned_type = $2 WHERE id = $3`,
      [String(driver1Id), 'driver', beacon011.id]
    );
    await client.query(
      `UPDATE devices.beacons SET assigned_to = $1, assigned_type = $2 WHERE id = $3`,
      [String(employee1Id), 'staff', beacon012.id]
    );
    await client.query(
      `UPDATE devices.beacons SET assigned_to = $1, assigned_type = $2 WHERE id = $3`,
      [String(driver2Id), 'driver', beacon013.id]
    );

    // 10. Seed Compliance Logs
    console.log("Inserting compliance logs into institute_compliance...");
    await client.query(`
      INSERT INTO institute.institute_compliance (
        org_id, document_name, sub_law_reference, registration_number, category,
        authority_name, authority_contact, date_recorded, status, remarks
      ) VALUES 
      ($1, 'Speed Governor Calibration Audit', 'Rule 118 of Central Motor Vehicles Rules', 'SG-2026-998', 'Speed Governor', 'Karnataka RTO', '080-2224433', '2026-05-10', 'Compliant', 'Speed lock verified at 60 km/h for all Tata buses.'),
      ($1, 'School Bus Safety Inspection', 'Supreme Court Guidelines on School Bus Safety', 'SB-2026-102', 'Safety Audit', 'Department of Transport', '080-2224434', '2026-05-12', 'Compliant', 'Emergency exits, first aid kits, and fire extinguishers checked and verified.'),
      ($1, 'RTO Permit Renewal Audit', 'Section 66 under Motor Vehicles Act', 'PM-2026-441', 'RTO Permit', 'RTO Bangalore Central', '080-2224435', '2026-05-15', 'Pending Renewal', 'Permit renewal application submitted; awaiting physical inspection.'),
      ($1, 'Driver Health & Safety Check', 'Occupational Health & Safety Guidelines', 'HS-2026-01', 'Health & Safety', 'Fortis Medical Center', '080-2224436', '2026-05-20', 'Compliant', 'Vision check and general physical evaluation completed for Rajesh and Suresh.'),
      ($1, 'Pollution Under Control Certificate Audit', 'Section 190(2) of Motor Vehicles Act', 'PUC-2026-881', 'Pollution Certificate', 'Karnataka Pollution Control Board', '080-2224437', '2026-06-01', 'Pending Renewal', 'Emission test completed; awaiting physical certificate copy.'),
      ($1, 'Fire Safety Clearance NOC', 'Fire Prevention and Safety Measures Act', 'FS-2026-302', 'Safety Audit', 'Karnataka Fire & Emergency Services', '080-2224438', '2026-05-25', 'Compliant', 'All portable extinguishers refilled and pressure tested.'),
      ($1, 'Vehicle Registration Certificate (RC) Audit', 'Section 39 of Motor Vehicles Act', 'RC-2026-1122', 'RTO Permit', 'Karnataka RTO', '080-2224439', '2026-05-28', 'Compliant', 'RC Smart Card verification and matching completed.')
    `, [String(orgId)]);

    console.log("Seeding successful! All entities created and linked with devices.");

  } catch (err) {
    console.error("Error during seeding data:", err);
  } finally {
    try {
      // Re-enable Row Level Security on all tables
      await client.query('ALTER TABLE institute.institute_vehicles ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE institute.institute_drivers ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE institute.institute_employees ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE institute.institute_gps ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE institute.institute_beacon ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE institute.institute_compliance ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE devices.gps ENABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE devices.beacons ENABLE ROW LEVEL SECURITY');
    } catch {}
    client.release();
    process.exit();
  }
}

run();
