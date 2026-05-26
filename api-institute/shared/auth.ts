import jwt from "jsonwebtoken";
import type { HttpRequest } from "@azure/functions";

export interface MdsToken {
  sub: string;
  email: string;
  org_id: number;
  role_name: string;
  permissions: string[];
  access_level: string;
  is_owner: boolean;
}

export function signToken(payload: MdsToken): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    algorithm: "HS256",
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? "86400"),
  });
}

export function requireAuth(
  req: HttpRequest,
): { user: MdsToken } | { error: string } {
  // TEMPORARY BYPASS FOR TESTING ALL APIS
  return {
    user: {
      sub: "1",
      email: "admin@vanloka.com",
      org_id: 1,
      role_name: "ORG_ADMIN",
      permissions: ["*"],
      access_level: "TENANT",
      is_owner: true,
    }
  };
}
