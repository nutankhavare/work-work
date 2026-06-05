import { app, HttpRequest, InvocationContext } from "@azure/functions";
import type { HttpResponseInit } from "@azure/functions";
import jwt from "jsonwebtoken";
import pool, { withRLS } from "../lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "dummy-secret-for-now";
const EMPLOYEE_TABLE = 'schemaa."officeEmployees"';
const ROLE_TABLE = 'schemaa."officeRoles"';

const stateDistrictSeed = [
  { id: 1, state: "Tamil Nadu", district: "Chennai", city: "Chennai", pincode: "600001" },
  { id: 2, state: "Tamil Nadu", district: "Coimbatore", city: "Coimbatore", pincode: "641001" },
  { id: 3, state: "Karnataka", district: "Bengaluru Urban", city: "Bengaluru", pincode: "560001" },
  { id: 4, state: "Telangana", district: "Hyderabad", city: "Hyderabad", pincode: "500001" },
  { id: 5, state: "Maharashtra", district: "Pune", city: "Pune", pincode: "411001" },
];

type RoleRow = {
  id: number;
  org_id: string;
  name: string;
  description: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type EmployeeRow = {
  id: number;
  org_id: string;
  employee_id: string | null;
  photo: string | null;
  employment_type: string | null;
  designation: string | null;
  joining_date: string | null;
  first_name: string;
  last_name: string;
  gender: string | null;
  marital_status: string | null;
  date_of_birth: string | null;
  email: string | null;
  phone: string;
  dependants: Array<Record<string, unknown>> | null;
  address_line_1: string | null;
  address_line_2: string | null;
  landmark: string | null;
  state: string | null;
  district: string | null;
  city: string | null;
  pin_code: string | null;
  primary_person_name: string | null;
  primary_person_email: string | null;
  primary_person_phone_1: string | null;
  primary_person_phone_2: string | null;
  secondary_person_name: string | null;
  secondary_person_email: string | null;
  secondary_person_phone_1: string | null;
  secondary_person_phone_2: string | null;
  account_holder_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  bank_name: string | null;
  aadhaar_card: string | null;
  pan_card: string | null;
  bank_proof: string | null;
  status: string | null;
  remarks: string | null;
  roles: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
} & Record<string, unknown>;

let schemaAttempted = false;
let schemaReady = false;
let inMemoryEmployeeId = 1;
let inMemoryEmployees: EmployeeRow[] = [];
let inMemoryRoles: RoleRow[] = [];

function getOrgId(request: HttpRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  try {
    const token = authHeader.split(" ")[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.org_id;
  } catch {
    return null;
  }
}

function getResponse(status: number, jsonBody: unknown): HttpResponseInit {
  return {
    status,
    headers: {
      "content-type": "application/json",
    },
    jsonBody,
  };
}

function isMultipart(request: HttpRequest): boolean {
  const contentType = request.headers.get("content-type") || "";
  return contentType.toLowerCase().includes("multipart/form-data");
}

function parseDependants(raw: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) return raw as Array<Record<string, unknown>>;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function readRequestBody(request: HttpRequest): Promise<Record<string, unknown>> {
  if (isMultipart(request)) {
    const form = await request.formData();
    const payload: Record<string, unknown> = {};

    for (const [key, value] of form.entries()) {
      if (value && typeof value === "object" && "name" in value) {
        payload[key] = (value as any).name;
        continue;
      }

      if (key === "roles[]") {
        if (!Array.isArray(payload.roles)) payload.roles = [];
        (payload.roles as string[]).push(String(value));
        continue;
      }

      if (key === "roles") {
        if (!Array.isArray(payload.roles)) payload.roles = [];
        (payload.roles as string[]).push(String(value));
        continue;
      }

      if (key in payload) {
        const prev = payload[key];
        payload[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
      } else {
        payload[key] = value;
      }
    }

    return payload;
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return body || {};
}

function normalizeEmployeeRow(row: any): EmployeeRow {
  const roles = Array.isArray(row.roles) ? row.roles.map((x: any) => String(x)) : [];

  return {
    ...row,
    id: Number(row.id),
    org_id: String(row.org_id),
    employee_id: row.employee_id ?? null,
    photo: row.photo ?? null,
    employment_type: row.employment_type ?? null,
    designation: row.designation ?? null,
    joining_date: row.joining_date ? String(row.joining_date) : null,
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    gender: row.gender ?? null,
    marital_status: row.marital_status ?? null,
    date_of_birth: row.date_of_birth ? String(row.date_of_birth) : row.dob ? String(row.dob) : null,
    email: row.email ?? null,
    phone: row.phone ?? "",
    dependants: Array.isArray(row.dependants) ? row.dependants : parseDependants(row.dependants),
    address_line_1: row.address_line_1 ?? null,
    address_line_2: row.address_line_2 ?? null,
    landmark: row.landmark ?? null,
    state: row.state ?? null,
    district: row.district ?? null,
    city: row.city ?? null,
    pin_code: row.pin_code ?? null,
    primary_person_name: row.primary_person_name ?? null,
    primary_person_email: row.primary_person_email ?? null,
    primary_person_phone_1: row.primary_person_phone_1 ?? null,
    primary_person_phone_2: row.primary_person_phone_2 ?? null,
    secondary_person_name: row.secondary_person_name ?? null,
    secondary_person_email: row.secondary_person_email ?? null,
    secondary_person_phone_1: row.secondary_person_phone_1 ?? null,
    secondary_person_phone_2: row.secondary_person_phone_2 ?? null,
    account_holder_name: row.account_holder_name ?? null,
    account_number: row.account_number ?? null,
    ifsc_code: row.ifsc_code ?? null,
    bank_name: row.bank_name ?? null,
    aadhaar_card: row.aadhaar_card ?? null,
    pan_card: row.pan_card ?? null,
    bank_proof: row.bank_proof ?? null,
    status: row.status ?? "active",
    remarks: row.remarks ?? null,
    roles,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

function toEmployeeResponse(row: EmployeeRow) {
  const normalized = normalizeEmployeeRow(row);
  return {
    ...normalized,
    user: {
      roles: (normalized.roles || []).map((name) => ({ name })),
    },
  };
}

function parseEmployeePayload(body: Record<string, unknown>, partial = false): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  const getString = (value: unknown) => {
    if (typeof value !== "string") return "";
    return value.trim();
  };

  const requiredFields = ["first_name", "last_name", "phone"];
  if (!partial) {
    for (const field of requiredFields) {
      const value = getString(body[field]);
      if (!value) {
        throw new Error(`${field} is required`);
      }
    }
  }

  const fieldWhitelist = [
    "employee_id",
    "photo",
    "employment_type",
    "designation",
    "joining_date",
    "first_name",
    "last_name",
    "gender",
    "marital_status",
    "date_of_birth",
    "dob",
    "email",
    "phone",
    "address_line_1",
    "address_line_2",
    "landmark",
    "state",
    "district",
    "city",
    "pin_code",
    "primary_person_name",
    "primary_person_email",
    "primary_person_phone_1",
    "primary_person_phone_2",
    "secondary_person_name",
    "secondary_person_email",
    "secondary_person_phone_1",
    "secondary_person_phone_2",
    "account_holder_name",
    "account_number",
    "ifsc_code",
    "bank_name",
    "aadhaar_card",
    "pan_card",
    "bank_proof",
    "status",
    "remarks",
  ] as const;

  for (const key of fieldWhitelist) {
    const raw = body[key];
    if (raw === undefined || raw === null) continue;

    if (key === "dob") {
      const value = getString(raw);
      if (value) payload.date_of_birth = value;
      continue;
    }

    const value = getString(raw);
    if (!value) continue;
    payload[key] = value;
  }

  payload.roles = Array.isArray(body.roles)
    ? body.roles.map((role) => String(role))
    : typeof body.roles === "string"
      ? [body.roles]
      : [];

  if (body.dependants !== undefined) {
    payload.dependants = parseDependants(body.dependants);
  }

  if (!payload.status) payload.status = "active";

  return payload;
}

function ensureFallbackSeed(orgId: string) {
  if (!inMemoryRoles.some((role) => role.org_id === orgId)) {
    inMemoryRoles.push({
      id: inMemoryRoles.length + 1,
      org_id: orgId,
      name: "admin",
      description: "System administrator",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

async function ensureStaffSchema(context: InvocationContext) {
  if (schemaAttempted) return;

  schemaAttempted = true;
  try {
    const statements = [
      `CREATE SCHEMA IF NOT EXISTS schemaa`,
      `
        CREATE TABLE IF NOT EXISTS ${ROLE_TABLE} (
          id SERIAL PRIMARY KEY,
          org_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(org_id, name)
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS ${EMPLOYEE_TABLE} (
          id SERIAL PRIMARY KEY,
          org_id TEXT NOT NULL,
          employee_id TEXT,
          photo TEXT,
          employment_type TEXT,
          designation TEXT,
          joining_date DATE,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          gender TEXT,
          marital_status TEXT,
          date_of_birth DATE,
          email TEXT,
          phone TEXT NOT NULL,
          dependants JSONB DEFAULT '[]'::jsonb,
          address_line_1 TEXT,
          address_line_2 TEXT,
          landmark TEXT,
          state TEXT,
          district TEXT,
          city TEXT,
          pin_code TEXT,
          primary_person_name TEXT,
          primary_person_email TEXT,
          primary_person_phone_1 TEXT,
          primary_person_phone_2 TEXT,
          secondary_person_name TEXT,
          secondary_person_email TEXT,
          secondary_person_phone_1 TEXT,
          secondary_person_phone_2 TEXT,
          account_holder_name TEXT,
          account_number TEXT,
          ifsc_code TEXT,
          bank_name TEXT,
          aadhaar_card TEXT,
          pan_card TEXT,
          bank_proof TEXT,
          status TEXT DEFAULT 'active',
          remarks TEXT,
          roles JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `,
    ];

    for (const statement of statements) {
      await pool.query(statement);
    }

    schemaReady = true;
    context.log("staff schema ready");
  } catch (error: any) {
    schemaReady = false;
    context.warn(`staff schema unavailable; using fallback mode: ${error?.message || "unknown error"}`);
  }
}

export async function getRoles(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const orgId = getOrgId(request);
  if (!orgId) return getResponse(401, { message: "Unauthorized" });

  await ensureStaffSchema(context);

  try {
    if (!schemaReady) {
      ensureFallbackSeed(orgId);
      return getResponse(200, { success: true, data: inMemoryRoles.filter((role) => role.org_id === orgId) });
    }

    const rows = await withRLS(orgId, async (client) => {
      const result = await client.query(
        `SELECT id, org_id, name, description, created_at, updated_at FROM ${ROLE_TABLE} WHERE org_id = $1 ORDER BY id DESC`,
        [orgId],
      );

      if (!result.rowCount) {
        const inserted = await client.query(
          `INSERT INTO ${ROLE_TABLE} (org_id, name, description) VALUES ($1, $2, $3) RETURNING id, org_id, name, description, created_at, updated_at`,
          [orgId, "admin", "System administrator"],
        );
        return inserted.rows;
      }

      return result.rows;
    });

    return getResponse(200, { success: true, data: rows });
  } catch (error: any) {
    context.error(`getRoles error: ${error?.message || "unknown"}`);
    ensureFallbackSeed(orgId);
    return getResponse(200, { success: true, data: inMemoryRoles.filter((role) => role.org_id === orgId) });
  }
}

export async function getStates(_request: HttpRequest): Promise<HttpResponseInit> {
  return getResponse(200, stateDistrictSeed);
}

export async function getDistricts(request: HttpRequest): Promise<HttpResponseInit> {
  const state = String(request.params?.state || "").toLowerCase();
  const rows = stateDistrictSeed.filter((item) => item.state.toLowerCase() === state);
  return getResponse(200, rows);
}

export async function getEmployees(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const orgId = getOrgId(request);
  if (!orgId) return getResponse(401, { message: "Unauthorized" });

  await ensureStaffSchema(context);

  const page = Math.max(Number(request.query.get("page") ?? 1) || 1, 1);
  const perPage = Math.min(Math.max(Number(request.query.get("per_page") ?? 10) || 10, 1), 100);
  const search = String(request.query.get("search") || "").trim().toLowerCase();
  const status = String(request.query.get("status") || "").trim().toLowerCase();
  const role = String(request.query.get("role") || "").trim().toLowerCase();
  const offset = (page - 1) * perPage;

  const applyFilters = (rows: EmployeeRow[]) =>
    rows.filter((row) => {
      const matchesSearch =
        !search ||
        [row.employee_id, row.first_name, row.last_name, row.email, row.phone, row.designation]
          .some((value) => String(value || "").toLowerCase().includes(search));

      const matchesStatus = !status || String(row.status || "").toLowerCase() === status;
      const matchesRole = !role || (Array.isArray(row.roles) && row.roles.some((r) => String(r || "").toLowerCase().includes(role)));
      return matchesSearch && matchesStatus && matchesRole;
    });

  try {
    if (!schemaReady) {
      const filtered = applyFilters(inMemoryEmployees.filter((item) => item.org_id === orgId));
      const paged = filtered.slice(offset, offset + perPage).map(normalizeEmployeeRow);

      return getResponse(200, {
        success: true,
        data: {
          data: paged,
          current_page: page,
          last_page: Math.max(Math.ceil(filtered.length / perPage), 1),
          per_page: perPage,
          total: filtered.length,
          from: paged.length ? offset + 1 : 0,
          to: paged.length ? offset + paged.length : 0,
        },
      });
    }

    const rows = await withRLS(orgId, async (client) => {
      const result = await client.query(`SELECT * FROM ${EMPLOYEE_TABLE} WHERE org_id = $1 ORDER BY id DESC`, [orgId]);
      return result.rows as EmployeeRow[];
    });

    const filtered = applyFilters(rows.map(normalizeEmployeeRow));
    const paged = filtered.slice(offset, offset + perPage);

    return getResponse(200, {
      success: true,
      data: {
        data: paged,
        current_page: page,
        last_page: Math.max(Math.ceil(filtered.length / perPage), 1),
        per_page: perPage,
        total: filtered.length,
        from: paged.length ? offset + 1 : 0,
        to: paged.length ? offset + paged.length : 0,
      },
    });
  } catch (error: any) {
    context.error(`getEmployees error: ${error?.message || "unknown"}`);
    return getResponse(500, { success: false, message: "Failed to fetch staff" });
  }
}

export async function getEmployeeById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const orgId = getOrgId(request);
  if (!orgId) return getResponse(401, { message: "Unauthorized" });

  await ensureStaffSchema(context);

  const id = Number(request.params?.id || 0);
  if (!Number.isFinite(id) || id <= 0) {
    return getResponse(400, { success: false, message: "Invalid employee id" });
  }

  try {
    if (!schemaReady) {
      const row = inMemoryEmployees.find((item) => item.org_id === orgId && item.id === id);
      if (!row) return getResponse(404, { success: false, message: "Employee not found" });
      return getResponse(200, { success: true, data: toEmployeeResponse(row) });
    }

    const rows = await withRLS(orgId, async (client) => {
      const result = await client.query(`SELECT * FROM ${EMPLOYEE_TABLE} WHERE org_id = $1 AND id = $2 LIMIT 1`, [orgId, id]);
      return result.rows as EmployeeRow[];
    });

    if (!rows.length) return getResponse(404, { success: false, message: "Employee not found" });
    return getResponse(200, { success: true, data: toEmployeeResponse(rows[0]) });
  } catch (error: any) {
    context.error(`getEmployeeById error: ${error?.message || "unknown"}`);
    return getResponse(500, { success: false, message: "Failed to fetch employee" });
  }
}

async function upsertEmployee(
  request: HttpRequest,
  context: InvocationContext,
  options: { id?: number; partial: boolean },
): Promise<HttpResponseInit> {
  const orgId = getOrgId(request);
  if (!orgId) return getResponse(401, { message: "Unauthorized" });

  await ensureStaffSchema(context);

  let body = await readRequestBody(request);

  if (options.id && String(body._method || "").toUpperCase() === "PUT") {
    delete body._method;
  }

  let payload: Record<string, unknown>;
  try {
    payload = parseEmployeePayload(body, options.partial);
  } catch (error: any) {
    return getResponse(400, { success: false, message: error?.message || "Invalid payload" });
  }

  try {
    if (!schemaReady) {
      if (!options.id) {
        const created = normalizeEmployeeRow({
          id: inMemoryEmployeeId++,
          org_id: orgId,
          ...payload,
          roles: Array.isArray(payload.roles) ? payload.roles : [],
          dependants: Array.isArray(payload.dependants) ? payload.dependants : [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        inMemoryEmployees.push(created);
        return getResponse(201, { success: true, data: toEmployeeResponse(created), message: "Staff created successfully" });
      }

      const index = inMemoryEmployees.findIndex((item) => item.org_id === orgId && item.id === options.id);
      if (index < 0) return getResponse(404, { success: false, message: "Employee not found" });

      const updated = normalizeEmployeeRow({
        ...inMemoryEmployees[index],
        ...payload,
        id: options.id,
        org_id: orgId,
        updated_at: new Date().toISOString(),
      });
      inMemoryEmployees[index] = updated;

      return getResponse(200, { success: true, data: toEmployeeResponse(updated), message: "Staff updated successfully" });
    }

    if (!options.id) {
      const columns = ["org_id", ...Object.keys(payload)];
      const values = [orgId, ...Object.values(payload)];

      const placeholders = columns
        .map((column, i) => (column === "roles" || column === "dependants" ? `$${i + 1}::jsonb` : `$${i + 1}`))
        .join(", ");

      const rows = await withRLS(orgId, async (client) => {
        const result = await client.query(
          `INSERT INTO ${EMPLOYEE_TABLE} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
          values.map((value, idx) => {
            const column = columns[idx];
            return column === "roles" || column === "dependants" ? JSON.stringify(value) : value;
          }),
        );
        return result.rows as EmployeeRow[];
      });

      return getResponse(201, { success: true, data: toEmployeeResponse(rows[0]), message: "Staff created successfully" });
    }

    const entries = Object.entries(payload);
    if (!entries.length) return getResponse(400, { success: false, message: "At least one field is required" });

    const setClause = entries.map(([key], idx) => `${key} = $${idx + 1}`).join(", ");
    const values = entries.map(([, value], idx) => {
      const column = entries[idx][0];
      return column === "roles" || column === "dependants" ? JSON.stringify(value) : value;
    });

    const rows = await withRLS(orgId, async (client) => {
      const result = await client.query(
        `UPDATE ${EMPLOYEE_TABLE} SET ${setClause}, updated_at = NOW() WHERE org_id = $${values.length + 1} AND id = $${values.length + 2} RETURNING *`,
        [...values, orgId, options.id],
      );
      return result.rows as EmployeeRow[];
    });

    if (!rows.length) return getResponse(404, { success: false, message: "Employee not found" });

    return getResponse(200, { success: true, data: toEmployeeResponse(rows[0]), message: "Staff updated successfully" });
  } catch (error: any) {
    context.error(`upsertEmployee error: ${error?.message || "unknown"}`);
    return getResponse(500, { success: false, message: "Failed to save staff" });
  }
}

export async function createEmployee(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  return upsertEmployee(request, context, { partial: false });
}

export async function updateEmployee(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = Number(request.params?.id || 0);
  if (!Number.isFinite(id) || id <= 0) {
    return getResponse(400, { success: false, message: "Invalid employee id" });
  }

  return upsertEmployee(request, context, { id, partial: true });
}

export async function updateEmployeeViaPost(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = Number(request.params?.id || 0);
  if (!Number.isFinite(id) || id <= 0) {
    return getResponse(400, { success: false, message: "Invalid employee id" });
  }

  const body = await readRequestBody(request);
  const method = String(body._method || "").toUpperCase();
  if (method !== "PUT") {
    return getResponse(400, { success: false, message: "Unsupported method override" });
  }

  const reqProxy = {
    ...request,
    json: async () => body,
  } as HttpRequest;

  return upsertEmployee(reqProxy, context, { id, partial: true });
}

export async function deleteEmployee(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const orgId = getOrgId(request);
  if (!orgId) return getResponse(401, { message: "Unauthorized" });

  await ensureStaffSchema(context);

  const id = Number(request.params?.id || 0);
  if (!Number.isFinite(id) || id <= 0) {
    return getResponse(400, { success: false, message: "Invalid employee id" });
  }

  try {
    if (!schemaReady) {
      const index = inMemoryEmployees.findIndex((item) => item.org_id === orgId && item.id === id);
      if (index < 0) return getResponse(404, { success: false, message: "Employee not found" });
      const [deleted] = inMemoryEmployees.splice(index, 1);
      return getResponse(200, { success: true, data: normalizeEmployeeRow(deleted), message: "Staff deleted successfully" });
    }

    const rows = await withRLS(orgId, async (client) => {
      const result = await client.query(
        `DELETE FROM ${EMPLOYEE_TABLE} WHERE org_id = $1 AND id = $2 RETURNING *`,
        [orgId, id],
      );
      return result.rows as EmployeeRow[];
    });

    if (!rows.length) return getResponse(404, { success: false, message: "Employee not found" });
    return getResponse(200, { success: true, data: normalizeEmployeeRow(rows[0]), message: "Staff deleted successfully" });
  } catch (error: any) {
    context.error(`deleteEmployee error: ${error?.message || "unknown"}`);
    return getResponse(500, { success: false, message: "Failed to delete staff" });
  }
}

app.http("getRoles", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "roles",
  handler: getRoles,
});

app.http("getStates", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "masters/forms/dropdowns/states",
  handler: getStates,
});

app.http("getDistricts", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "masters/forms/dropdowns/districts/{state}",
  handler: getDistricts,
});

app.http("getEmployees", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "employees",
  handler: getEmployees,
});

app.http("getEmployeeById", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "employees/{id}",
  handler: getEmployeeById,
});

app.http("createEmployee", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "employees",
  handler: createEmployee,
});

app.http("updateEmployee", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "employees/{id}",
  handler: updateEmployee,
});

app.http("updateEmployeeViaPost", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "employees/{id}",
  handler: updateEmployeeViaPost,
});

app.http("deleteEmployee", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "employees/{id}",
  handler: deleteEmployee,
});
