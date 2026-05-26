import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("activeVehiclesDropdown", {
  route: "active-vehicles/for/dropdown",
  methods: ["GET", "OPTIONS"],
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

      const result = await client.query(`
        SELECT id, vehicle_number, model FROM schema1.institute_vehicles
        WHERE org_id = $1 AND status = 'Active'
        ORDER BY vehicle_number ASC
      `, [token.org_id]);

      return ok(result.rows);
    } catch (e: any) {
      ctx.error(e);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});

app.http("beaconDeviceDropdown", {
  route: "beacon-device/for/dropdown",
  methods: ["GET", "OPTIONS"],
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

      const result = await client.query(`
        SELECT id, device_id, sequence_id, battery_level, status, assigned_to
        FROM schema1.institute_beacon
        WHERE allocated_to_org = $1
        ORDER BY device_id ASC
      `, [token.org_id]);

      return ok(result.rows);
    } catch (e: any) {
      ctx.error(e);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});

app.http("gpsDeviceDropdown", {
  route: "gps-device/for/dropdown",
  methods: ["GET", "OPTIONS"],
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

      const result = await client.query(`
        SELECT id, device_id, sim_number, status, assigned_to
        FROM schema1.institute_gps
        WHERE allocated_to_org = $1
        ORDER BY device_id ASC
      `, [token.org_id]);

      return ok(result.rows);
    } catch (e: any) {
      ctx.error(e);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
