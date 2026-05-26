import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("dashboardStats", {
  route: "dashboard/stats",
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

      // Note: If you need to extend with existing queries, you can add them here.
      // Based on prompt, we add employeeCount and driverCount from schema1.
      const employeeResult = await client.query(
        `SELECT COUNT(*) FROM schema1.institute_employees WHERE org_id = $1 AND status = 'Active'`,
        [token.org_id]
      );
      
      const driverResult = await client.query(
        `SELECT COUNT(*) FROM schema1.institute_drivers WHERE org_id = $1 AND status = 'Active'`,
        [token.org_id]
      );

      const vehicleResult = await client.query(
        `SELECT COUNT(*) FROM schema1.institute_vehicles WHERE org_id = $1 AND status = 'Active'`,
        [token.org_id]
      );

      const data = {
        employeeCount: parseInt(employeeResult.rows[0].count, 10),
        driverCount: parseInt(driverResult.rows[0].count, 10),
        vehicleCount: parseInt(vehicleResult.rows[0].count, 10),
      };

      return ok(data);
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
