import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("employeesIndex", {
  route: "employees",
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      if (req.method === "GET") {
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const perPage = parseInt(url.searchParams.get("per_page") || "15", 10);
        const search = url.searchParams.get("search") || null;
        const status = url.searchParams.get("status") || null;
        const offset = (page - 1) * perPage;

        const countResult = await client.query(`
          SELECT COUNT(*) FROM schema1.institute_employees
          WHERE org_id = $1::text
            AND ($2::text IS NULL OR status = $2)
            AND ($3::text IS NULL OR (
              first_name ILIKE '%' || $3 || '%' OR
              last_name ILIKE '%' || $3 || '%' OR
              email ILIKE '%' || $3 || '%' OR
              phone ILIKE '%' || $3 || '%' OR
              employee_id ILIKE '%' || $3 || '%'
            ))
        `, [String(token.org_id), status, search]);
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await client.query(`
          SELECT *
          FROM schema1.institute_employees
          WHERE org_id = $1::text
            AND ($2::text IS NULL OR status = $2)
            AND ($3::text IS NULL OR (
              first_name ILIKE '%' || $3 || '%' OR
              last_name ILIKE '%' || $3 || '%' OR
              email ILIKE '%' || $3 || '%' OR
              phone ILIKE '%' || $3 || '%' OR
              employee_id ILIKE '%' || $3 || '%'
            ))
          ORDER BY created_at DESC
          LIMIT $4 OFFSET $5
        `, [String(token.org_id), status, search, perPage, offset]);

        return ok({
          data: result.rows,
          current_page: page,
          last_page: Math.ceil(total / perPage),
          per_page: perPage,
          total: total,
          from: total === 0 ? null : offset + 1,
          to: Math.min(page * perPage, total)
        });
      }

      if (req.method === "POST") {
        const { fields, files } = await parseMultipart(req);
        
        let photoUrl = null;
        if (files.photo) {
          photoUrl = await uploadToBlob(files.photo.buffer, files.photo.filename, files.photo.mimetype, 'employees');
        }

        // Parse roles from "roles[]" fields
        const rolesArr: string[] = [];
        for (const [key, val] of Object.entries(fields)) {
          if (key === 'roles[]' || key.startsWith('roles[')) {
            rolesArr.push(String(val));
          }
        }

        const result = await client.query(`
          INSERT INTO schema1.institute_employees (
            org_id, employee_id, first_name, last_name, gender, marital_status,
            date_of_birth, joining_date, employment_type, designation, email, phone,
            address_line_1, address_line_2, landmark, state, district, city, pin_code,
            primary_person_name, primary_person_phone_1, primary_person_email,
            bank_name, account_holder_name, account_number, ifsc_code,
            photo, roles, status, beacon_id, remarks
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
            $13, $14, $15, $16, $17, $18, $19,
            $20, $21, $22,
            $23, $24, $25, $26,
            $27, $28::jsonb, $29, $30, $31
          ) RETURNING *
        `, [
          String(token.org_id), fields.employee_id, fields.first_name, fields.last_name,
          fields.gender, fields.marital_status,
          fields.date_of_birth || null, fields.joining_date || null,
          fields.employment_type, fields.designation, fields.email, fields.phone,
          fields.address_line_1, fields.address_line_2, fields.landmark,
          fields.state, fields.district, fields.city, fields.pin_code,
          fields.primary_person_name, fields.primary_person_phone_1, fields.primary_person_email,
          fields.bank_name, fields.account_holder_name, fields.account_number, fields.ifsc_code,
          photoUrl, JSON.stringify(rolesArr.length > 0 ? rolesArr : (fields.roles ? [fields.roles] : [])),
          fields.status || 'Active', fields.beacon_id, fields.remarks
        ]);

        // Sync beacon assignment
        if (fields.beacon_id) {
          try {
            await client.query(
              `UPDATE schema1.institute_beacon SET assigned_to = $1, assigned_type = 'staff', status = 'Assigned', is_active = true, synced_at = NOW()
               WHERE device_id = $2 AND allocated_to_org = $3::text`,
              [fields.first_name + ' ' + (fields.last_name || ''), fields.beacon_id, String(token.org_id)]
            );
          } catch (_) { /* beacon table may not have data */ }
        }

        return ok(result.rows[0]);
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.code === "23505") return err(409, "Employee already exists");
      return err(500, e.message || "Internal server error");
    } finally {
      client?.release();
    }
  }
});
