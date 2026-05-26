import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { ApiResponse } from "../types/index";
import { AppError } from "../middleware/errorHandler";
import pool from "../lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "dummy-secret-for-now";
const DUMMY_ORG_ID = process.env.DUMMY_ORG_ID || "00000000-0000-0000-0000-000000000001";

interface LoginRequest {
  email: string;
  password?: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    org_id: string;
  };
}

interface RefreshResponse {
  id: string;
  name: string;
  email: string;
  roles: string[];
  tenant_id: string;
  permissions: string[];
}

/**
 * @POST /api/tenant-login
 * Handle login (dummy implementation)
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body as LoginRequest;

    if (!email) {
      throw new AppError(400, "Email is required");
    }

    console.log(`[AUTH] Dummy login attempt for: ${email}`);

    // Try to find real user and org
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    let finalOrgId = DUMMY_ORG_ID;
    let userName = "Administrator";
    let userId = "user-123";

    if (userRes.rows.length > 0) {
      finalOrgId = userRes.rows[0].org_id || DUMMY_ORG_ID;
      userName = userRes.rows[0].name || "Administrator";
      userId = userRes.rows[0].id;
    } else {
      // Fallback: Use the first available organization if user not found in DB
      const orgRes = await pool.query("SELECT id FROM organizations ORDER BY id ASC LIMIT 1");
      if (orgRes.rows.length > 0) {
        finalOrgId = orgRes.rows[0].id;
      }
    }

    const token = jwt.sign(
      {
        id: String(userId),
        email,
        role: "admin",
        org_id: String(finalOrgId),
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Fetch organization details
    let organization = null;
    if (finalOrgId) {
      const orgRes = await pool.query(
        "SELECT id, name, email, phone, website, status FROM organizations WHERE id::text = $1 LIMIT 1",
        [String(finalOrgId)]
      );
      if (orgRes.rows.length > 0) {
        organization = orgRes.rows[0];
      }
    }

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: String(userId),
          name: userName,
          email,
          role: "admin",
          org_id: String(finalOrgId),
          organization,
        },
      },
    } as ApiResponse<LoginResponse>);
  } catch (error) {
    next(error);
  }
}

/**
 * @GET /api/refreshMe
 * Validate and refresh token
 */
export async function refreshMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Unauthorized");
    }

    // Fetch organization details
    let organization = null;
    if (req.user.org_id) {
      const orgRes = await pool.query(
        "SELECT id, name, email, phone, website, status FROM organizations WHERE id::text = $1 LIMIT 1",
        [String(req.user.org_id)]
      );
      if (orgRes.rows.length > 0) {
        organization = orgRes.rows[0];
      }
    }

    res.json({
      success: true,
      data: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        roles: [req.user.role],
        tenant_id: req.user.org_id,
        permissions: ["manage_fleet", "view_reports"],
        organization,
      },
    } as ApiResponse<RefreshResponse>);
  } catch (error) {
    next(error);
  }
}
