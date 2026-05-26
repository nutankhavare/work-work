import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("vehiclesIndex", {
  route: "vehicles",
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
          SELECT COUNT(*) FROM schema1.institute_vehicles
          WHERE org_id = $1::text
            AND ($2::text IS NULL OR status = $2)
            AND ($3::text IS NULL OR (
              vehicle_number ILIKE '%' || $3 || '%' OR
              model ILIKE '%' || $3 || '%' OR
              manufacturer ILIKE '%' || $3 || '%'
            ))
        `, [String(token.org_id), status, search]);
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await client.query(`
          SELECT *
          FROM schema1.institute_vehicles
          WHERE org_id = $1::text
            AND ($2::text IS NULL OR status = $2)
            AND ($3::text IS NULL OR (
              vehicle_number ILIKE '%' || $3 || '%' OR
              model ILIKE '%' || $3 || '%' OR
              manufacturer ILIKE '%' || $3 || '%'
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
        
        const docUploads: Record<string, string | null> = {};
        for (const [key, file] of Object.entries(files)) {
          docUploads[key] = await uploadToBlob(file.buffer, file.filename, file.mimetype, 'vehicles');
        }

        const result = await client.query(`
          INSERT INTO schema1.institute_vehicles (
            org_id, vehicle_number, model, manufacturer, vehicle_type, manufacturing_year,
            fuel_type, seating_capacity, vehicle_color, status, gps_device_id, gps_sim_number,
            gps_installation_date, assigned_driver_id, ownership_type, owner_name,
            owner_contact_number, insurance_provider_name, insurance_policy_number, insurance_expiry_date,
            permit_type, permit_number, permit_issue_date, permit_expiry_date, 
            fitness_certificate_number, fitness_expiry_date, pollution_certificate_number, pollution_expiry_date,
            last_service_date, next_service_due_date, kilometers_driven, 
            fire_extinguisher, first_aid_kit, cctv_installed, panic_button_installed,
            rc_book_doc, insurance_doc, fitness_certificate, puc_doc, remarks
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,
            $32, $33, $34, $35, $36, $37, $38, $39, $40
          ) RETURNING *
        `, [
          String(token.org_id), fields.vehicle_number, fields.model, fields.manufacturer,
          fields.vehicle_type, fields.manufacturing_year || null,
          fields.fuel_type, fields.seating_capacity ? parseInt(fields.seating_capacity) : null,
          fields.vehicle_color, fields.status || 'Active',
          fields.gps_device_id, fields.gps_sim_number,
          fields.gps_installation_date || null, fields.assigned_driver_id,
          fields.ownership_type, fields.owner_name, fields.owner_contact_number,
          fields.insurance_provider_name, fields.insurance_policy_number, fields.insurance_expiry_date || null,
          fields.permit_type, fields.permit_number, fields.permit_issue_date || null, fields.permit_expiry_date || null,
          fields.fitness_certificate_number, fields.fitness_expiry_date || null,
          fields.pollution_certificate_number, fields.pollution_expiry_date || null,
          fields.last_service_date || null, fields.next_service_due_date || null,
          fields.kilometers_driven ? parseInt(fields.kilometers_driven) : null,
          fields.fire_extinguisher || 'No', fields.first_aid_kit || 'No',
          fields.cctv_installed || 'No', fields.panic_button_installed || 'No',
          docUploads.rc_book_doc || null, docUploads.insurance_doc || null,
          docUploads.fitness_certificate || null, docUploads.puc_doc || null,
          fields.remarks
        ]);

        // Sync GPS device
        if (fields.gps_device_id) {
          try {
            await client.query(
              `UPDATE schema1.institute_gps SET assigned_to = $1, assigned_type = 'vehicle', status = 'Assigned', is_active = true, synced_at = NOW()
               WHERE device_id = $2 AND allocated_to_org = $3::text`,
              [fields.vehicle_number || result.rows[0].vehicle_number, fields.gps_device_id, String(token.org_id)]
            );
          } catch (_) { /* gps table may not have data */ }
        }

        return ok(result.rows[0]);
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.code === "23505") return err(409, "Vehicle already exists");
      return err(500, e.message || "Internal server error");
    } finally {
      client?.release();
    }
  }
});
