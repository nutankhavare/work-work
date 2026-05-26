import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("driversById", {
  route: "drivers/{id}",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      const driverId = req.params.id;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      if (req.method === "GET") {
        const result = await client.query(`
          SELECT d.*,
            v.vehicle_number as assigned_vehicle_number, v.model as assigned_vehicle_model
          FROM schema1.institute_drivers d
          LEFT JOIN schema1.institute_vehicles v ON v.id = CASE WHEN d.vehicle ~ '^[0-9]+$' THEN d.vehicle::integer ELSE NULL END
          WHERE d.id = $1 AND d.org_id = $2::text
        `, [driverId, String(token.org_id)]);

        if (result.rows.length === 0) return err(404, "Driver not found");

        // Get license/insurance records separately
        const licenseResult = await client.query(`
          SELECT id, type, number, issue_date, exp_date FROM schema1.institute_driver_license_insurance
          WHERE driver_id = $1 ORDER BY id
        `, [driverId]);

        const driver = result.rows[0];
        driver.license_insurance = licenseResult.rows;
        return ok(driver);
      }

      if (req.method === "POST") {
        const { fields, files } = await parseMultipart(req);
        
        let profilePhotoUrl: string | undefined = undefined;
        if (files.profile_photo) {
          profilePhotoUrl = await uploadToBlob(
            files.profile_photo.buffer, files.profile_photo.filename, files.profile_photo.mimetype, 'drivers'
          );
        }

        await client.query('BEGIN');
        const oldDriver = await client.query(`SELECT beacon_id FROM schema1.institute_drivers WHERE id = $1 AND org_id = $2::text`, [driverId, String(token.org_id)]);
        if (oldDriver.rows.length === 0) { await client.query('ROLLBACK'); return err(404, "Driver not found"); }

        try {
          const driverResult = await client.query(`
            UPDATE schema1.institute_drivers SET
              first_name = COALESCE($3, first_name),
              last_name = COALESCE($4, last_name),
              gender = COALESCE($5, gender),
              date_of_birth = COALESCE($6, date_of_birth),
              email = COALESCE($7, email),
              mobile_number = COALESCE($8, mobile_number),
              blood_group = COALESCE($9, blood_group),
              marital_status = COALESCE($10, marital_status),
              profile_photo = COALESCE($11, profile_photo),
              employment_type = COALESCE($12, employment_type),
              employee_id = COALESCE($13, employee_id),
              address_line_1 = COALESCE($14, address_line_1),
              city = COALESCE($15, city),
              district = COALESCE($16, district),
              state = COALESCE($17, state),
              pin_code = COALESCE($18, pin_code),
              vehicle = COALESCE($19, vehicle),
              beacon_id = COALESCE($20, beacon_id),
              status = COALESCE($21, status),
              remarks = COALESCE($22, remarks),
              updated_at = NOW()
            WHERE id = $1 AND org_id = $2::text
            RETURNING *
          `, [
            driverId, String(token.org_id), 
            fields.first_name, fields.last_name, fields.gender, 
            fields.date_of_birth || null, fields.email, fields.mobile_number, fields.blood_group, 
            fields.marital_status, profilePhotoUrl, fields.employment_type, 
            fields.employee_id, fields.address_line_1, fields.city, fields.district, 
            fields.state, fields.pin_code, 
            fields.vehicle || fields.assigned_vehicle_id,
            fields.beacon_id, fields.status, fields.remarks
          ]);

          if (driverResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return err(404, "Driver not found");
          }

          // Upsert license records
          const licenseCheck = await client.query(
            `SELECT id FROM schema1.institute_driver_license_insurance WHERE driver_id = $1`,
            [driverId]
          );

          if (licenseCheck.rows.length > 0) {
            await client.query(`
              UPDATE schema1.institute_driver_license_insurance SET
                number = COALESCE($2, number),
                issue_date = COALESCE($3, issue_date),
                exp_date = COALESCE($4, exp_date),
                type = COALESCE($5, type)
              WHERE driver_id = $1
            `, [
              driverId, fields.dl_number, fields.dl_issue_date || null, 
              fields.dl_expiry_date || null, fields.license_type
            ]);
          } else if (fields.dl_number || fields.license_type) {
            await client.query(`
              INSERT INTO schema1.institute_driver_license_insurance (
                driver_id, number, issue_date, exp_date, type
              ) VALUES ($1, $2, $3, $4, $5)
            `, [
              driverId, fields.dl_number, fields.dl_issue_date || null, 
              fields.dl_expiry_date || null, fields.license_type
            ]);
          }

          await client.query('COMMIT');

          // Sync beacon
          try {
            const oldBeaconId = oldDriver.rows[0].beacon_id;
            const newBeaconId = fields.beacon_id;

            if (oldBeaconId && oldBeaconId !== newBeaconId) {
              await client.query(
                `UPDATE schema1.institute_beacon SET assigned_to = NULL, assigned_type = NULL, status = 'Unassigned', is_active = true, synced_at = NOW()
                 WHERE device_id = $1 AND allocated_to_org = $2::text`,
                [oldBeaconId, String(token.org_id)]
              );
            }

            if (newBeaconId) {
              const driverName = (driverResult.rows[0].first_name || '') + ' ' + (driverResult.rows[0].last_name || '');
              await client.query(
                `UPDATE schema1.institute_beacon SET assigned_to = $1, assigned_type = 'driver', status = 'Assigned', is_active = true, synced_at = NOW()
                 WHERE device_id = $2 AND allocated_to_org = $3::text`,
                [driverName, newBeaconId, String(token.org_id)]
              );
            }
          } catch (_) { /* beacon table may not exist */ }

          return ok(driverResult.rows[0]);
        } catch (txnError) {
          await client.query('ROLLBACK');
          throw txnError;
        }
      }

      if (req.method === "DELETE") {
        await client.query('BEGIN');
        try {
          const driver = await client.query(`SELECT beacon_id FROM schema1.institute_drivers WHERE id = $1 AND org_id = $2::text`, [driverId, String(token.org_id)]);
          if (driver.rows.length > 0 && driver.rows[0].beacon_id) {
            await client.query(
              `UPDATE schema1.institute_beacon SET assigned_to = NULL, assigned_type = NULL, status = 'Unassigned', is_active = true, synced_at = NOW()
               WHERE device_id = $1 AND allocated_to_org = $2::text`,
              [driver.rows[0].beacon_id, String(token.org_id)]
            );
          }

          await client.query(`DELETE FROM schema1.institute_driver_license_insurance WHERE driver_id = $1`, [driverId]);
          const result = await client.query(
            `DELETE FROM schema1.institute_drivers WHERE id = $1 AND org_id = $2::text`,
            [driverId, String(token.org_id)]
          );
          if (result.rowCount === 0) { await client.query('ROLLBACK'); return err(404, "Driver not found"); }
          await client.query('COMMIT');
          return ok({ deleted: true });
        } catch (txnError) {
          await client.query('ROLLBACK');
          throw txnError;
        }
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.code === "23505") return err(409, "Driver already exists");
      return err(500, e.message || "Internal server error");
    } finally {
      client?.release();
    }
  }
});
