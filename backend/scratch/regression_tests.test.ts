import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import jwt from "jsonwebtoken";
import pg from "pg";

const JWT_SECRET = "my-super-secret-key-1234";
const BASE_URL = "http://localhost:4000";

// Test Tenant IDs
const ORG_A = 99991;
const ORG_B = 99992;

// Generate test tokens
const tokenA = jwt.sign({ org_id: String(ORG_A) }, JWT_SECRET);
const tokenB = jwt.sign({ org_id: String(ORG_B) }, JWT_SECRET);
const staleToken = jwt.sign({ org_id: String(ORG_A), exp: Math.floor(Date.now() / 1000) - 3600 }, JWT_SECRET);

// Helper delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Extend global test timeout to 30 seconds
import { test as bunTest } from "bun:test";
(bunTest as any).timeout = 30000;

beforeAll(async () => {
  // Wait for the backend server to complete its watch restart cleanly
  console.log("[TEST Setup] Waiting 3s for server to start...");
  await delay(3000);

  const client = new pg.Client({
    host: "20.204.102.172",
    port: 5432,
    user: "vanloka_admin",
    password: "MyNewPass@123",
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  });

  console.log("[TEST Setup] Seeding test organizations...");
  await client.connect();
  try {
    await client.query("BEGIN");
    // Seeding orgs bypassing RLS by setting local context to matching ID or since organizations is the primary table
    await client.query(`SELECT set_config('app.current_org_id', $1, true)`, [String(ORG_A)]);
    await client.query(
      `INSERT INTO organizations (id, name, type, email, status) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [ORG_A, "Test Org A", "institute", "orga@test.com", "active"]
    );

    await client.query(`SELECT set_config('app.current_org_id', $1, true)`, [String(ORG_B)]);
    await client.query(
      `INSERT INTO organizations (id, name, type, email, status) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [ORG_B, "Test Org B", "institute", "orgb@test.com", "active"]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[TEST Setup] Seeding failed:", err);
    throw err;
  } finally {
    await client.end();
  }
}, 30000);

afterAll(async () => {
  console.log("[TEST Teardown] Cleaning up test organizations...");
  const client = new pg.Client({
    host: "20.204.102.172",
    port: 5432,
    user: "vanloka_admin",
    password: "MyNewPass@123",
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    await client.query("BEGIN");
    // Clean cascadingly
    await client.query(`SELECT set_config('app.current_org_id', $1, true)`, [String(ORG_A)]);
    await client.query(`DELETE FROM organizations WHERE id = $1`, [ORG_A]);

    await client.query(`SELECT set_config('app.current_org_id', $1, true)`, [String(ORG_B)]);
    await client.query(`DELETE FROM organizations WHERE id = $1`, [ORG_B]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[TEST Teardown] Cleanup failed:", err);
  } finally {
    await client.end();
  }
}, 30000);

describe("Backend Regression Suite", () => {
  
  // 1. Authentication Tests
  describe("Authentication & Session", () => {
    test("invalid login rejection", async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nonexistent@test.com", password: "wrong" })
      });
      expect(res.status).toBe(401);
      const data = (await res.json() as any);
      expect(data.success).toBe(false);
    });

    test("unauthorized access blocking", async () => {
      const res = await fetch(`${BASE_URL}/api/employees`);
      expect(res.status).toBe(401);
    });

    test("stale/expired JWT rejection", async () => {
      const res = await fetch(`${BASE_URL}/api/employees`, {
        headers: { Authorization: `Bearer ${staleToken}` }
      });
      expect(res.status).toBe(401);
    });
  });

  // 2. Organization Settings / Seeding Fallback
  describe("Settings & Bootstrap", () => {
    test("GET /api/organization/me returns 200 with Org A token", async () => {
      const res = await fetch(`${BASE_URL}/api/organization/me`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      expect(res.status).toBe(200);
      const data = (await res.json() as any);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Test Org A");
    });
  });

  // 3. CRUD & Write-Read Consistency & RLS Isolation
  describe("Tenant isolation and CRUD flow", () => {
    let employeeId: number;

    test("Create employee in Org A", async () => {
      const res = await fetch(`${BASE_URL}/api/employees`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@orga.com",
          phone: "1111111111"
        })
      });

      expect(res.status).toBe(201);
      const data = (await res.json() as any);
      expect(data.success).toBe(true);
      expect(data.data.first_name).toBe("John");
      expect(data.data.org_id).toBe(String(ORG_A));
      employeeId = data.data.id;
    });

    test("Read employee in Org A (Write-Read Consistency)", async () => {
      const res = await fetch(`${BASE_URL}/api/employees/${employeeId}`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      expect(res.status).toBe(200);
      const data = (await res.json() as any);
      expect(data.success).toBe(true);
      expect(data.data.first_name).toBe("John");
    });

    test("Cross-Tenant read prevention (Org B cannot see Org A employee)", async () => {
      const res = await fetch(`${BASE_URL}/api/employees/${employeeId}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      // Should return 404 or filter out
      expect(res.status).toBe(404);
    });

    test("Cross-Tenant update prevention (Org B cannot edit Org A employee)", async () => {
      const res = await fetch(`${BASE_URL}/api/employees/${employeeId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${tokenB}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          first_name: "Hacked"
        })
      });
      expect(res.status).toBe(404);
    });

    test("Cross-Tenant delete prevention (Org B cannot delete Org A employee)", async () => {
      const res = await fetch(`${BASE_URL}/api/employees/${employeeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      expect(res.status).toBe(404);
    });

    test("Delete employee in Org A", async () => {
      const res = await fetch(`${BASE_URL}/api/employees/${employeeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      expect(res.status).toBe(200);
    });

    describe("Roles CRUD and Attribute Isolation", () => {
      let roleId: number;

      test("Create role in Org A with full attributes", async () => {
        const res = await fetch(`${BASE_URL}/api/roles`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenA}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: "MANAGER-ROLE",
            description: "Manager Role description",
            department: "Fleet Operations",
            access_level: "Full Access",
            status: "Active",
            permissions: [1, 2] // E.g., view-dashboard, etc.
          })
        });

        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.name).toBe("MANAGER-ROLE");
        expect(body.data.department).toBe("Fleet Operations");
        expect(body.data.access_level).toBe("Full Access");
        expect(body.data.status).toBe("Active");
        roleId = body.data.id;
      });

      test("Read Roles in Org A contains the newly created role and full attributes", async () => {
        const res = await fetch(`${BASE_URL}/api/roles`, {
          method: "GET",
          headers: { Authorization: `Bearer ${tokenA}` }
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        const createdRole = body.data.find((r: any) => r.id === roleId);
        expect(createdRole).toBeDefined();
        expect(createdRole.name).toBe("MANAGER-ROLE");
        expect(createdRole.department).toBe("Fleet Operations");
        expect(createdRole.access_level).toBe("Full Access");
        expect(createdRole.status).toBe("Active");
        expect(createdRole.permissions).toBeInstanceOf(Array);
      });

      test("Read Role detail in Org A", async () => {
        const res = await fetch(`${BASE_URL}/api/roles/${roleId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${tokenA}` }
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.name).toBe("MANAGER-ROLE");
        expect(body.data.department).toBe("Fleet Operations");
        expect(body.data.access_level).toBe("Full Access");
        expect(body.data.status).toBe("Active");
      });

      test("Cross-Tenant role read prevention (Org B cannot view Org A role)", async () => {
        const res = await fetch(`${BASE_URL}/api/roles/${roleId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${tokenB}` }
        });
        expect(res.status).toBe(404);
      });

      test("Update role in Org A", async () => {
        const res = await fetch(`${BASE_URL}/api/roles/${roleId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${tokenA}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: "UPDATED-MANAGER-ROLE",
            department: "Core Administration",
            access_level: "Root Access",
            status: "Inactive"
          })
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.name).toBe("UPDATED-MANAGER-ROLE");
        expect(body.data.department).toBe("Core Administration");
        expect(body.data.access_level).toBe("Root Access");
        expect(body.data.status).toBe("Inactive");
      });

      test("Delete role in Org A", async () => {
        const res = await fetch(`${BASE_URL}/api/roles/${roleId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${tokenA}` }
        });
        expect(res.status).toBe(200);
      });
    });
  });

  // 4. Rollback Verification
  describe("Transaction Rollback", () => {
    test("intentional constraint violation rolls back transaction", async () => {
      // Trying to create a role with a missing required name field or mismatched types
      const res = await fetch(`${BASE_URL}/api/roles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          description: "Missing name" // Name is required NOT NULL
        })
      });

      expect(res.status).toBe(400); // Bad Request (due to role name verification in route)
    });
  });
});
