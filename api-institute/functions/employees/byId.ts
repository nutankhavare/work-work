import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("employeesById", {
  route: "employees/{id}",
  methods: ["GET", "PUT", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      const employeeId = req.params.id;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      if (req.method === "GET") {
        const result = await client.query(`
          SELECT * FROM schema1.institute_employees
          WHERE id = $1 AND org_id = $2::text
        `, [employeeId, String(token.org_id)]);

        if (result.rows.length === 0) return err(404, "Employee not found");
        return ok(result.rows[0]);
      }

      if (req.method === "PUT") {
        const { fields, files } = await parseMultipart(req);
        
        let photoUrl: string | undefined = undefined;
        if (files.photo) {
          photoUrl = await uploadToBlob(files.photo.buffer, files.photo.filename, files.photo.mimetype, 'employees');
        }

        // Parse roles
        const rolesArr: string[] = [];
        for (const [key, val] of Object.entries(fields)) {
          if (key === 'roles[]' || key.startsWith('roles[')) {
            rolesArr.push(String(val));
          }
        }
        const rolesJson = rolesArr.length > 0 ? JSON.stringify(rolesArr) : (fields.roles ? fields.roles : null);

        const oldEmp = await client.query(`SELECT beacon_id FROM schema1.institute_employees WHERE id = $1 AND org_id = $2::text`, [employeeId, String(token.org_id)]);
        if (oldEmp.rows.length === 0) return err(404, "Employee not found");

        const result = await client.query(`
          UPDATE schema1.institute_employees SET
            first_name = COALESCE($3, first_name),
            last_name = COALESCE($4, last_name),
            gender = COALESCE($5, gender),
            marital_status = COALESCE($6, marital_status),
            email = COALESCE($7, email),
            phone = COALESCE($8, phone),
            designation = COALESCE($9, designation),
            employment_type = COALESCE($10, employment_type),
            joining_date = COALESCE($11, joining_date),
            date_of_birth = COALESCE($12, date_of_birth),
            address_line_1 = COALESCE($13, address_line_1),
            address_line_2 = COALESCE($14, address_line_2),
            landmark = COALESCE($15, landmark),
            state = COALESCE($16, state),
            district = COALESCE($17, district),
            city = COALESCE($18, city),
            pin_code = COALESCE($19, pin_code),
            primary_person_name = COALESCE($20, primary_person_name),
            primary_person_phone_1 = COALESCE($21, primary_person_phone_1),
            primary_person_email = COALESCE($22, primary_person_email),
            bank_name = COALESCE($23, bank_name),
            account_holder_name = COALESCE($24, account_holder_name),
            account_number = COALESCE($25, account_number),
            ifsc_code = COALESCE($26, ifsc_code),
            photo = COALESCE($27, photo),
            roles = COALESCE($28::jsonb, roles),
            status = COALESCE($29, status),
            beacon_id = COALESCE($30, beacon_id),
            remarks = COALESCE($31, remarks),
            updated_at = NOW()
          WHERE id = $1 AND org_id = $2::text
          RETURNING *
        `, [
          employeeId, String(token.org_id),
          fields.first_name, fields.last_name, fields.gender, fields.marital_status,
          fields.email, fields.phone, fields.designation, fields.employment_type,
          fields.joining_date || null, fields.date_of_birth || null,
          fields.address_line_1, fields.address_line_2, fields.landmark,
          fields.state, fields.district, fields.city, fields.pin_code,
          fields.primary_person_name, fields.primary_person_phone_1, fields.primary_person_email,
          fields.bank_name, fields.account_holder_name, fields.account_number, fields.ifsc_code,
          photoUrl, rolesJson, fields.status, fields.beacon_id, fields.remarks
        ]);

        if (result.rows.length === 0) return err(404, "Employee not found");

        // Sync beacon
        try {
          const oldBeaconId = oldEmp.rows[0].beacon_id;
          const newBeaconId = fields.beacon_id;

          if (oldBeaconId && oldBeaconId !== newBeaconId) {
            await client.query(
              `UPDATE schema1.institute_beacon SET assigned_to = NULL, assigned_type = NULL, status = 'Unassigned', is_active = true, synced_at = NOW()
               WHERE device_id = $1 AND allocated_to_org = $2::text`,
              [oldBeaconId, String(token.org_id)]
            );
          }

          if (newBeaconId) {
            const empName = (result.rows[0].first_name || '') + ' ' + (result.rows[0].last_name || '');
            await client.query(
              `UPDATE schema1.institute_beacon SET assigned_to = $1, assigned_type = 'staff', status = 'Assigned', is_active = true, synced_at = NOW()
               WHERE device_id = $2 AND allocated_to_org = $3::text`,
              [empName, newBeaconId, String(token.org_id)]
            );
          }
        } catch (_) { /* beacon table may not exist */ }

        return ok(result.rows[0]);
      }

      if (req.method === "DELETE") {
        await client.query('BEGIN');
        try {
          const emp = await client.query(`SELECT beacon_id FROM schema1.institute_employees WHERE id = $1 AND org_id = $2::text`, [employeeId, String(token.org_id)]);
          if (emp.rows.length > 0 && emp.rows[0].beacon_id) {
            await client.query(
              `UPDATE schema1.institute_beacon SET assigned_to = NULL, assigned_type = NULL, status = 'Unassigned', is_active = true, synced_at = NOW()
               WHERE device_id = $1 AND allocated_to_org = $2::text`,
              [emp.rows[0].beacon_id, String(token.org_id)]
            );
          }

          const result = await client.query(
            `DELETE FROM schema1.institute_employees WHERE id = $1 AND org_id = $2::text`,
            [employeeId, String(token.org_id)]
          );
          if (result.rowCount === 0) { await client.query('ROLLBACK'); return err(404, "Employee not found"); }
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
      if (e.code === "23505") return err(409, "Record already exists");
      return err(500, e.message || "Internal server error");
    } finally {
      client?.release();
    }
  }
});
