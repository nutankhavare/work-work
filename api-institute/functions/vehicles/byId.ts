import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("vehiclesById", {
  route: "vehicles/{id}",
  methods: ["GET", "PUT", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      const vehicleId = req.params.id;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      if (req.method === "GET") {
        const result = await client.query(`
          SELECT * FROM schema1.institute_vehicles
          WHERE id = $1 AND org_id = $2::text
        `, [vehicleId, String(token.org_id)]);

        if (result.rows.length === 0) return err(404, "Vehicle not found");
        return ok(result.rows[0]);
      }

      if (req.method === "PUT") {
        const { fields, files } = await parseMultipart(req);
        
        const docUploads: Record<string, string | undefined> = {};
        for (const [key, file] of Object.entries(files)) {
          docUploads[key] = await uploadToBlob(file.buffer, file.filename, file.mimetype, 'vehicles');
        }

        const oldVehicle = await client.query(`SELECT gps_device_id, vehicle_number FROM schema1.institute_vehicles WHERE id = $1 AND org_id = $2::text`, [vehicleId, String(token.org_id)]);
        if (oldVehicle.rows.length === 0) return err(404, "Vehicle not found");

        const result = await client.query(`
          UPDATE schema1.institute_vehicles SET
            vehicle_number = COALESCE($3, vehicle_number),
            model = COALESCE($4, model),
            manufacturer = COALESCE($5, manufacturer),
            vehicle_type = COALESCE($6, vehicle_type),
            manufacturing_year = COALESCE($7, manufacturing_year),
            fuel_type = COALESCE($8, fuel_type),
            seating_capacity = COALESCE($9, seating_capacity),
            vehicle_color = COALESCE($10, vehicle_color),
            status = COALESCE($11, status),
            gps_device_id = COALESCE($12, gps_device_id),
            gps_sim_number = COALESCE($13, gps_sim_number),
            gps_installation_date = COALESCE($14, gps_installation_date),
            assigned_driver_id = COALESCE($15, assigned_driver_id),
            ownership_type = COALESCE($16, ownership_type),
            owner_name = COALESCE($17, owner_name),
            owner_contact_number = COALESCE($18, owner_contact_number),
            insurance_provider_name = COALESCE($19, insurance_provider_name),
            insurance_policy_number = COALESCE($20, insurance_policy_number),
            insurance_expiry_date = COALESCE($21, insurance_expiry_date),
            permit_type = COALESCE($22, permit_type),
            permit_number = COALESCE($23, permit_number),
            permit_issue_date = COALESCE($24, permit_issue_date),
            permit_expiry_date = COALESCE($25, permit_expiry_date),
            fitness_certificate_number = COALESCE($26, fitness_certificate_number),
            fitness_expiry_date = COALESCE($27, fitness_expiry_date),
            pollution_certificate_number = COALESCE($28, pollution_certificate_number),
            pollution_expiry_date = COALESCE($29, pollution_expiry_date),
            last_service_date = COALESCE($30, last_service_date),
            next_service_due_date = COALESCE($31, next_service_due_date),
            kilometers_driven = COALESCE($32, kilometers_driven),
            fire_extinguisher = COALESCE($33, fire_extinguisher),
            first_aid_kit = COALESCE($34, first_aid_kit),
            cctv_installed = COALESCE($35, cctv_installed),
            panic_button_installed = COALESCE($36, panic_button_installed),
            rc_book_doc = COALESCE($37, rc_book_doc),
            insurance_doc = COALESCE($38, insurance_doc),
            fitness_certificate = COALESCE($39, fitness_certificate),
            puc_doc = COALESCE($40, puc_doc),
            remarks = COALESCE($41, remarks),
            updated_at = NOW()
          WHERE id = $1 AND org_id = $2::text
          RETURNING *
        `, [
          vehicleId, String(token.org_id),
          fields.vehicle_number, fields.model, fields.manufacturer,
          fields.vehicle_type, fields.manufacturing_year, fields.fuel_type,
          fields.seating_capacity ? parseInt(fields.seating_capacity) : null, fields.vehicle_color,
          fields.status, fields.gps_device_id, fields.gps_sim_number,
          fields.gps_installation_date || null, fields.assigned_driver_id,
          fields.ownership_type, fields.owner_name, fields.owner_contact_number,
          fields.insurance_provider_name, fields.insurance_policy_number, fields.insurance_expiry_date || null,
          fields.permit_type, fields.permit_number, fields.permit_issue_date || null, fields.permit_expiry_date || null,
          fields.fitness_certificate_number, fields.fitness_expiry_date || null,
          fields.pollution_certificate_number, fields.pollution_expiry_date || null,
          fields.last_service_date || null, fields.next_service_due_date || null,
          fields.kilometers_driven ? parseInt(fields.kilometers_driven) : null,
          fields.fire_extinguisher, fields.first_aid_kit, fields.cctv_installed, fields.panic_button_installed,
          docUploads.rc_book_doc, docUploads.insurance_doc, docUploads.fitness_certificate, docUploads.puc_doc,
          fields.remarks
        ]);

        if (result.rows.length === 0) return err(404, "Vehicle not found");

        // Sync GPS device
        try {
          const oldGpsId = oldVehicle.rows[0].gps_device_id;
          const newGpsId = fields.gps_device_id;

          if (oldGpsId && oldGpsId !== newGpsId) {
            await client.query(
              `UPDATE schema1.institute_gps SET assigned_to = NULL, assigned_type = NULL, status = 'Unassigned', is_active = true, synced_at = NOW()
               WHERE device_id = $1 AND allocated_to_org = $2::text`,
              [oldGpsId, String(token.org_id)]
            );
          }

          if (newGpsId) {
            const vNum = result.rows[0].vehicle_number;
            await client.query(
              `UPDATE schema1.institute_gps SET assigned_to = $1, assigned_type = 'vehicle', status = 'Assigned', is_active = true, synced_at = NOW()
               WHERE device_id = $2 AND allocated_to_org = $3::text`,
              [vNum, newGpsId, String(token.org_id)]
            );
          }
        } catch (_) { /* gps table may not have data */ }

        return ok(result.rows[0]);
      }

      if (req.method === "DELETE") {
        await client.query('BEGIN');
        try {
          const vehicle = await client.query(`SELECT gps_device_id FROM schema1.institute_vehicles WHERE id = $1 AND org_id = $2::text`, [vehicleId, String(token.org_id)]);
          if (vehicle.rows.length > 0 && vehicle.rows[0].gps_device_id) {
            await client.query(
              `UPDATE schema1.institute_gps SET assigned_to = NULL, assigned_type = NULL, status = 'Unassigned', is_active = true, synced_at = NOW()
               WHERE device_id = $1 AND allocated_to_org = $2::text`,
              [vehicle.rows[0].gps_device_id, String(token.org_id)]
            );
          }

          const result = await client.query(
            `DELETE FROM schema1.institute_vehicles WHERE id = $1 AND org_id = $2::text`,
            [vehicleId, String(token.org_id)]
          );
          if (result.rowCount === 0) { await client.query('ROLLBACK'); return err(404, "Vehicle not found"); }
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
      if (e.code === "23505") return err(409, "Vehicle already exists");
      return err(500, e.message || "Internal server error");
    } finally {
      client?.release();
    }
  }
});
