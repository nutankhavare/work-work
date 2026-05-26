import { app, HttpRequest, InvocationContext } from "@azure/functions";
import type { HttpResponseInit } from "@azure/functions";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "dummy-secret-for-now";

export async function login(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (request.method === "OPTIONS") {
        return { status: 204, headers: { "Access-Control-Allow-Origin": "*" } };
    }

    const client = await pool.connect();
    try {
        const body = (await request.json().catch(() => null)) as {
            email?: string;
            password?: string;
        } | null;
        
        if (!body?.email || !body?.password) {
            return { status: 400, jsonBody: { success: false, message: "Email and password required" } };
        }

        // Debug: check what tables exist
        const tables = await client.query(
            `SELECT table_schema, table_name FROM information_schema.tables 
             WHERE table_name = 'users' ORDER BY table_schema`
        );
        context.log("DEBUG tables named 'users':", JSON.stringify(tables.rows));

        // Debug: count rows in users
        try {
            const count = await client.query(`SELECT COUNT(*) as cnt FROM users`);
            context.log("DEBUG users count:", count.rows[0].cnt);

            const sample = await client.query(`SELECT id, email, role, org_id FROM users LIMIT 5`);
            context.log("DEBUG users sample:", JSON.stringify(sample.rows));
        } catch (e2: any) {
            context.log("DEBUG users query error:", e2.message);
        }

        // Query the shared `users` table
        const { rows } = await client.query(
            `SELECT id, email, password, role, org_id, created_at
             FROM users
             WHERE LOWER(email) = LOWER($1)
             LIMIT 1`,
            [body.email.trim()],
        );

        context.log("DEBUG login query result rows:", rows.length);

        const user = rows[0];
        if (!user) {
            return { status: 401, jsonBody: { success: false, message: "Invalid email or password" } };
        }

        context.log("DEBUG password starts with:", user.password?.substring(0, 10));
        context.log("DEBUG password length:", user.password?.length);

        // Support both bcrypt-hashed and plain-text passwords
        const valid = user.password?.startsWith("$2")
            ? await bcrypt.compare(body.password, user.password)
            : body.password === user.password;

        if (!valid) {
            return { status: 401, jsonBody: { success: false, message: "Invalid email or password" } };
        }

        // Determine permissions based on role
        const roleLower = (user.role ?? "").toLowerCase();
        const isOwner = roleLower.includes("admin") || roleLower.includes("owner") || roleLower === "super_admin";
        const permissions: string[] = isOwner ? ["*"] : [];
        const accessLevel = isOwner ? "Root Access" : "Partial Access";

        const token = jwt.sign(
            {
                sub: String(user.id),
                id: String(user.id),
                email: user.email,
                org_id: user.org_id,
                role: user.role, // For compatibility
                role_name: user.role,
                permissions,
                access_level: accessLevel,
                is_owner: isOwner,
                tenant_id: user.org_id, // For compatibility
            },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        // Fetch organization details
        let organization = null;
        if (user.org_id) {
            const orgRes = await client.query(
                `SELECT id, name, email, phone, website, status FROM organizations WHERE id::text = $1 LIMIT 1`,
                [String(user.org_id)]
            );
            if (orgRes.rows.length > 0) {
                organization = orgRes.rows[0];
            }
        }

        return {
            status: 200,
            jsonBody: {
                success: true,
                token,
                data: {
                    token,
                    user: {
                        id: user.id,
                        name: user.role || "Administrator",
                        email: user.email,
                        role: user.role,
                        orgId: user.org_id,
                        org_id: user.org_id,
                        tenant_id: user.org_id,
                        permissions,
                        accessLevel,
                        isOwner,
                        organization,
                    }
                }
            }
        };
    } catch (e) {
        context.error("authLogin error:", e);
        return { status: 500, jsonBody: { success: false, message: "Server error" } };
    } finally {
        client.release();
    }
}

export async function refreshMe(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (request.method === "OPTIONS") {
        return { status: 204, headers: { "Access-Control-Allow-Origin": "*" } };
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { status: 401, jsonBody: { success: false, message: "Unauthorized" } };
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return { status: 401, jsonBody: { success: false, message: "Unauthorized" } };
    }

    const client = await pool.connect();
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const { rows } = await client.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [decoded.id || decoded.sub]);
        const user = rows[0];

        if (!user) {
            return { status: 401, jsonBody: { success: false, message: "User not found" } };
        }

        const roleLower = (user.role ?? "").toLowerCase();
        const isOwner = roleLower.includes("admin") || roleLower.includes("owner") || roleLower === "super_admin";

        // Fetch organization details
        let organization = null;
        if (user.org_id) {
            const orgRes = await client.query(
                `SELECT id, name, email, phone, website, status FROM organizations WHERE id::text = $1 LIMIT 1`,
                [String(user.org_id)]
            );
            if (orgRes.rows.length > 0) {
                organization = orgRes.rows[0];
            }
        }

        return {
            status: 200,
            jsonBody: {
                success: true,
                data: {
                    id: user.id,
                    name: user.role || "Administrator",
                    email: user.email,
                    roles: [user.role],
                    role: user.role,
                    tenant_id: user.org_id,
                    org_id: user.org_id,
                    permissions: isOwner ? ["*"] : [],
                    isOwner,
                    organization
                }
            }
        };
    } catch (err) {
        context.error("refreshMe error:", err);
        return { status: 401, jsonBody: { success: false, message: "Unauthorized or invalid token" } };
    } finally {
        client.release();
    }
}

app.http('login', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'auth/login',
    handler: login
});

app.http('refreshMe', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'auth/refresh',
    handler: refreshMe
});
