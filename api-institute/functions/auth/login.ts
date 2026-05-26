import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import bcrypt from "bcryptjs";
import { getPool } from "../../shared/db";
import { ok, err, preflight } from "../../shared/response";
import { signToken } from "../../shared/auth";

app.http("authLogin", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "auth/login",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();

    const body = (await req.json().catch(() => null)) as { email?: string; password?: string } | null;
    if (!body?.email || !body?.password) {
      return err(400, "Email and password required");
    }

    const client = await getPool().connect();
    try {
      const { rows } = await client.query(
        `SELECT u.id, u.org_id, u.role, u.email, u.password,
                o.name as org_name, o.type as org_type
         FROM vanloka.users u
         LEFT JOIN vanloka.organizations o ON u.org_id = o.id
         WHERE LOWER(u.email) = LOWER($1)
         LIMIT 1`,
        [body.email.trim()]
      );

      const userRecord = rows[0];
      if (!userRecord) return err(401, "Invalid credentials");

      if (userRecord.org_type !== 'Institute') {
        ctx.log(`Login blocked: User belongs to org type '${userRecord.org_type}', not 'Institute'`);
        return err(401, "Wrong type of organization");
      }

      const valid = await bcrypt.compare(body.password, userRecord.password);
      if (!valid) return err(401, "Invalid credentials");

      const token = signToken({
        sub: String(userRecord.id),
        email: userRecord.email,
        org_id: userRecord.org_id,
        role_name: userRecord.role,
        permissions: ["*"],
        access_level: "Root Access",
        is_owner: true
      });

      // Fetch full organization details
      let organization = null;
      if (userRecord.org_id) {
        const orgRes = await client.query(
          "SELECT id, name, email, phone, website, status FROM vanloka.organizations WHERE id::text = $1::text LIMIT 1",
          [String(userRecord.org_id)]
        );
        if (orgRes.rows.length > 0) {
          organization = orgRes.rows[0];
        }
      }

      return ok({
        token,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.email,
          orgId: userRecord.org_id,
          orgName: userRecord.org_name,
          orgType: userRecord.org_type,
          roleName: userRecord.role,
          permissions: ["*"],
          accessLevel: "Root Access",
          isOwner: true,
          organization
        }
      });
    } catch (e: any) {
      ctx.error("authLogin:", e);
      return err(500, "Server error");
    } finally {
      client.release();
    }
  }
});
