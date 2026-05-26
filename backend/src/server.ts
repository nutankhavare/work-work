import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer, { MulterError } from "multer";
import pool from "./lib/db";
import { uploadToAzure } from "./lib/azureStorage";
import { sendEmail } from "./lib/messaging";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "dummy-secret-for-now";
const DUMMY_ORG_ID = "00000000-0000-0000-0000-000000000001";
const ROLE_TABLE = 'institute.institute_roles';
const PERMISSION_TABLE = 'institute.institute_permissions';
const ROLE_PERMISSION_TABLE = 'institute.institute_role_permissions';
const EMPLOYEE_TABLE = 'institute.institute_employees';
const VEHICLE_TABLE = 'institute.institute_vehicles';
const DRIVER_TABLE = 'institute.institute_drivers';
const COMPLIANCE_TABLE = 'institute.institute_compliance';
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed."));
    }
  }
});
const tableColumnCache = new Map<string, Set<string>>();

const stateDistrictSeed = [
  { id: 1, state: "Tamil Nadu", district: "Chennai", city: "Chennai", pincode: "600001" },
  { id: 2, state: "Tamil Nadu", district: "Coimbatore", city: "Coimbatore", pincode: "641001" },
  { id: 3, state: "Karnataka", district: "Bengaluru Urban", city: "Bengaluru", pincode: "560001" },
  { id: 4, state: "Telangana", district: "Hyderabad", city: "Hyderabad", pincode: "500001" },
  { id: 5, state: "Maharashtra", district: "Pune", city: "Pune", pincode: "411001" },
];

const dropdownValues: Record<string, string[]> = {
  "vehicle:vehicle_type": ["Bus", "Van", "Car", "Mini Bus"],
  "vehicle:fuel_type": ["Diesel", "Petrol", "CNG", "Electric"],
  "vehicle:permit_type": ["School", "Private", "Tourist", "State"],
  "vehicle:ownership_type": ["Owned", "Contract"],
  "common:gender": ["Male", "Female", "Other"],
  "common:blood_group": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "common:marital_status": ["Single", "Married", "Divorced", "Widowed"],
  "common:employment_type": ["Permanent", "Contract", "Part Time"],
  "common:status": ["active", "inactive", "maintenance"],
  "driver:file_type": [
    "driving_license",
    "aadhaar_card",
    "pan_card",
    "police_verification",
    "medical_fitness",
    "training_certificate",
  ],
};

app.use(helmet());
app.use(
  cors({
    origin: true, // Allow any origin, useful for local testing via network IP
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

function getOrgIdFromRequest(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;

  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { org_id?: string };
    return decoded.org_id || null;
  } catch {
    return null;
  }
}

function getPagination(req: Request) {
  const page = Math.max(Number(req.query.page ?? 1) || 1, 1);
  const perPage = Math.min(Math.max(Number(req.query.per_page ?? 10) || 10, 1), 100);
  const offset = (page - 1) * perPage;
  return { page, perPage, offset };
}

function paginatedPayload<T>(rows: T[], page: number, perPage: number, total: number) {
  const from = total > 0 ? (page - 1) * perPage + 1 : 0;
  const to = total > 0 ? Math.min((page - 1) * perPage + rows.length, total) : 0;
  return {
    success: true,
    data: {
      data: rows,
      current_page: page,
      last_page: Math.max(Math.ceil(total / perPage), 1),
      per_page: perPage,
      total,
      from,
      to,
    },
  };
}

async function fetchRowsWithOrgFallback(table: string, orgId: any) {
  const columns = await getTableColumns(table);
  
  if (columns.has("org_id") && orgId) {
    // Strict isolation: only show records for THIS organization
    const result = await pool.query(`SELECT * FROM ${table} WHERE org_id = $1 ORDER BY id DESC`, [String(orgId)]);
    return result.rows;
  }

  // If table has no org_id, show everything (global tables)
  const all = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC`);
  return all.rows;
}

function parseQualifiedTableName(table: string) {
  const parts = table.split(".");
  const schema = (parts[0] || "public").replace(/"/g, "");
  const name = (parts[1] || parts[0] || "").replace(/"/g, "");
  return { schema, name };
}

async function getTableColumns(table: string): Promise<Set<string>> {
  const cached = tableColumnCache.get(table);
  if (cached) return cached;

  const { schema, name } = parseQualifiedTableName(table);
  const result = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
    [schema, name]
  );

  const cols = new Set(result.rows.map((row: any) => String(row.column_name)));
  tableColumnCache.set(table, cols);
  return cols;
}

function normalizeVehicleRow(row: any) {
  return {
    ...row,
    vehicle_name: row.vehicle_name || row.vehicle_number || "-",
    make: row.make || row.manufacturer || "",
    model: row.model || row.vehicle_model || "",
    capacity: row.capacity ?? row.seating_capacity ?? null,
    lastGpsUpdate: row.lastGpsUpdate || row.last_gps_update || null,
  };
}

function toVehiclePayload(body: Record<string, unknown>, allowed: Set<string>) {
  const payload: Record<string, unknown> = {};
  const keys = [
    "vehicle_name",
    "vehicle_number",
    "model",
    "make",
    "capacity",
    "status",
    "gps_device_id",
    "battery",
    "lat",
    "lng",
    "speed",
    "last_gps_update",
    "vehicle_type",
    "rc_number",
    "rc_isued_date",
    "rc_expiry_date",
    "manufacturer",
    "vehicle_model",
    "manufacturing_year",
    "fuel_type",
    "seating_capacity",
    "vehicle_color",
    "kilometers_driven",
    "driver",
    "route",
    "gps_device",
    "gps_installation_date",
    "permit_type",
    "permit_number",
    "permit_issue_date",
    "permit_expiry_date",
    "ownership_type",
    "vendor_name",
    "vendor_contact_number",
    "organisation_fleet_name",
    "gps_sim_number",
    "beacon_count",
    "owner_name",
    "owner_contact_number",
    "assigned_driver_id",
    "assigned_route_id",
    "insurance_provider_name",
    "insurance_policy_number",
    "insurance_issued_date",
    "insurance_expiry_date",
    "fitness_certificate_number",
    "fitness_issued_date",
    "fitness_expiry_date",
    "pollution_certificate_number",
    "pollution_issued_date",
    "pollution_expiry_date",
    "last_service_date",
    "next_service_due_date",
    "tyre_replacement_due_date",
    "battery_replacement_due_date",
    "fire_extinguisher",
    "first_aid_kit",
    "cctv_installed",
    "panic_button_installed",
    "remarks",
    "vehicle_remarks",
    "insurance_doc",
    "rc_book_doc",
    "puc_doc",
    "fitness_certificate",
    "permit_copy",
    "gps_installation_proof",
    "saftey_certificate",
    "vendor_pan",
    "vendor_adhaar",
    "vendor_bank_proof",
    "vendor_contract_proof",
    "vedor_company_registration_doc",
    "owner_id_proof",
    "vendor_agreement",
  ];

  for (const key of keys) {
    if (!allowed.has(key)) continue;
    const value = body[key];
    if (value === undefined || value === null || value === "") continue;
    payload[key] = value;
  }

  if (allowed.has("vehicle_name") && !payload.vehicle_name && typeof payload.vehicle_number === "string") {
    payload.vehicle_name = payload.vehicle_number;
  }

  return payload;
}

function toEmployeePayload(body: Record<string, unknown>, allowed: Set<string>) {
  const payload: Record<string, unknown> = {};
  const keys = [
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
    "roles"
  ];

  for (const key of keys) {
    if (!allowed.has(key)) continue;
    let value = body[key];

    // Handle mapping for dob -> date_of_birth if needed
    if (key === "date_of_birth" && !value) value = body["dob"];

    if (value === undefined || value === null || value === "") continue;
    
    // Handle roles if it comes as roles[] or array
    if (key === "roles") {
      if (typeof value === "string") {
        try { payload[key] = JSON.stringify([value]); } catch { payload[key] = JSON.stringify([]); }
      } else if (Array.isArray(value)) {
        payload[key] = JSON.stringify(value);
      }
      continue;
    }

    payload[key] = value;
  }

  return payload;
}

function toDriverPayload(body: Record<string, unknown>, allowed: Set<string>) {
  const payload: Record<string, unknown> = {};
  const keys = [
    "first_name", "last_name", "email", "mobile_number", "date_of_birth", "gender", "blood_group",
    "marital_status", "number_of_dependents", "address_line_1", "address_line_2", "landmark",
    "state", "district", "city", "pin_code", "employment_type", "employee_id", "driving_experience",
    "safety_training_completion", "safety_training_completion_date", "medical_fitness",
    "medical_fitness_exp_date", "police_verification", "police_verification_date",
    "account_holder_name", "bank_name", "account_number", "ifsc_code", "primary_person_name",
    "primary_person_phone_1", "primary_person_phone_2", "primary_person_email",
    "secondary_person_name", "secondary_person_phone_1", "secondary_person_phone_2",
    "secondary_person_email", "license_insurance", "vehicle", "beacon_id", "status", "remarks",
    "profile_photo", "driving_license", "aadhaar_card", "pan_card", "police_verification_doc",
    "medical_fitness_certificate", "address_proof_doc", "training_certificate_doc"
  ];

  for (const key of keys) {
    if (!allowed.has(key)) continue;
    let value = body[key];
    if (value === undefined || value === null || value === "") continue;
    
    // For arrays or JSON encoded items like license_insurance
    if (key === "license_insurance") {
      if (typeof value === "string") {
        try { JSON.parse(value); payload[key] = value; } 
        catch { payload[key] = JSON.stringify([]); }
      } else if (Array.isArray(value)) {
        payload[key] = JSON.stringify(value);
      }
      continue;
    }
    
    payload[key] = value;
  }
  return payload;
}

async function processFiles(files: any, columns: Set<string>, payload: any) {
  const fileArray = Array.isArray(files) ? files : [];
  for (const file of fileArray) {
    if (columns.has(file.fieldname)) {
      try {
        const url = await uploadToAzure(file.buffer, file.originalname, file.mimetype);
        payload[file.fieldname] = url;
      } catch (err) {
        console.error(`[AZURE] Upload failed for ${file.fieldname}:`, err);
      }
    }
  }
}

const generateSetClause = (payload: Record<string, any>, startIdx = 1) => {
  return Object.keys(payload)
    .map((k, i) => `${k} = $${i + startIdx}`)
    .join(", ");
};

app.get("/health", async (_req: Request, res: Response) => {
  try {
    const conn = await pool.connect();
    conn.release();
    res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch {
    res.json({ status: "ok", db: "disconnected", timestamp: new Date().toISOString() });
  }
});

// Auth endpoints

app.post("/api/auth/login", async (req: Request, res: Response) => {
  const email = String(req.body?.email || "").trim();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password are required" });
    return;
  }

  const client = await pool.connect();
  try {
    // Bypass RLS specifically for the login query using the database's `login_bypass` policy
    await client.query(`SET app.is_login_query = 'true'`);

    const { rows } = await client.query(
      `SELECT id, email, password, role, org_id, created_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    // Reset the setting immediately after reading the user
    await client.query(`RESET app.is_login_query`);

    console.log(`[AUTH] Login attempt for ${email}. Found ${rows.length} users.`);
    const user = rows[0];
    if (!user) {
      console.log(`[AUTH] User not found: ${email}`);
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const valid = user.password?.startsWith("$2")
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    console.log(`[AUTH] Password valid for ${email}: ${valid}`);
    if (!valid) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

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
        role: user.role,
        role_name: user.role,
        permissions,
        access_level: accessLevel,
        is_owner: isOwner,
        tenant_id: user.org_id, // Compatibility
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Fetch organization details
    let organization = null;
    if (user.org_id) {
      const orgRes = await client.query(
        "SELECT id, name, email, phone, website, status FROM organizations WHERE id::text = $1 LIMIT 1",
        [String(user.org_id)]
      );
      if (orgRes.rows.length > 0) {
        organization = orgRes.rows[0];
      }
    }

    res.json({
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
          tenant_id: user.org_id, // Compatibility
          permissions,
          accessLevel,
          isOwner,
          organization,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

app.get("/api/auth/refresh", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const client = await pool.connect();
  try {
    const auth = req.headers.authorization;
    const token = auth!.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const { rows } = await client.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [decoded.id || decoded.sub]);
    const user = rows[0];

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    const roleLower = (user.role ?? "").toLowerCase();
    const isOwner = roleLower.includes("admin") || roleLower.includes("owner") || roleLower === "super_admin";

    // Fetch organization details
    let organization = null;
    if (user.org_id) {
      const orgRes = await client.query(
        "SELECT id, name, email, phone, website, status FROM organizations WHERE id::text = $1 LIMIT 1",
        [String(user.org_id)]
      );
      if (orgRes.rows.length > 0) {
        organization = orgRes.rows[0];
      }
    }

    res.json({
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
    });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(401).json({ message: "Unauthorized or invalid token" });
  } finally {
    client.release();
  }
});

// Employees
app.get("/api/employees", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { page, perPage, offset } = getPagination(req);
  const search = String(req.query.search || "").trim().toLowerCase();
  const status = String(req.query.status || "").trim().toLowerCase();
  const role = String(req.query.role || "").trim().toLowerCase();

  try {
    let rows = await fetchRowsWithOrgFallback(EMPLOYEE_TABLE, orgId);

    rows = rows.filter((row: any) => {
      const roleList = Array.isArray(row.roles) ? row.roles : [];
      const matchesSearch =
        !search ||
        [row.employee_id, row.first_name, row.last_name, row.email, row.phone, row.designation]
          .some((v) => String(v || "").toLowerCase().includes(search));
      const matchesStatus = !status || String(row.status || "").toLowerCase() === status;
      const matchesRole = !role || roleList.some((r: any) => String(r || "").toLowerCase().includes(role));
      return matchesSearch && matchesStatus && matchesRole;
    });

    const total = rows.length;
    const paged = rows.slice(offset, offset + perPage);
    res.json(paginatedPayload(paged, page, perPage, total));
  } catch {
    res.json(paginatedPayload([], page, perPage, 0));
  }
});

app.get("/api/employees/:id", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ success: false, message: "Invalid employee id" });
    return;
  }

  try {
    const employeeResult = await pool.query(
      `SELECT * FROM ${EMPLOYEE_TABLE} WHERE org_id = $1 AND id = $2 LIMIT 1`,
      [orgId, id]
    );

    if (!employeeResult.rows.length) {
      res.status(404).json({ success: false, message: "Employee not found" });
      return;
    }

    const employee = employeeResult.rows[0];

    // Fetch dependants
    const dependantsResult = await pool.query(
      `SELECT * FROM institute.institute_employee_dependants WHERE employee_id = $1`,
      [id]
    );
    employee.dependants = dependantsResult.rows;

    res.json({ success: true, data: employee });
  } catch (err) {
    console.error("Fetch employee detail error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch employee" });
  }
});

app.post("/api/employees", upload.any(), async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const columns = await getTableColumns(EMPLOYEE_TABLE);
    
    // 1. Prepare Payload
    const payload = toEmployeePayload(req.body as Record<string, unknown>, columns);
    payload.org_id = orgId;

    // Handle files (Azure Blob Storage)
    await processFiles(req.files, columns, payload);

    // 2. Insert Employee
    const insertColumns = Object.keys(payload);
    const placeholders = insertColumns.map((_, idx) => `$${idx + 1}`).join(", ");
    const values = insertColumns.map(k => payload[k]);

    const result = await client.query(
      `INSERT INTO ${EMPLOYEE_TABLE} (${insertColumns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    const newEmployee = result.rows[0];

    // 3. Handle Dependants
    if (req.body.dependants) {
      try {
        const dependants = JSON.parse(String(req.body.dependants));
        if (Array.isArray(dependants)) {
          for (const dep of dependants) {
            if (!dep.fullname) continue;
            await client.query(
              `INSERT INTO institute.institute_employee_dependants (employee_id, fullname, relation, age, phone, email)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [newEmployee.id, dep.fullname, dep.relation, dep.age, dep.phone, dep.email]
            );
          }
        }
      } catch (e) {
        console.error("Failed to parse dependants JSON:", e);
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, data: newEmployee, message: "Staff created successfully" });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Create employee error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to create staff" });
  } finally {
    client.release();
  }
});

app.put("/api/employees/:id", upload.any(), async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const columns = await getTableColumns(EMPLOYEE_TABLE);
    
    // 1. Prepare Payload
    const payload = toEmployeePayload(req.body as Record<string, unknown>, columns);
    payload.updated_at = new Date().toISOString();

    // Handle files (Azure Blob Storage)
    await processFiles(req.files, columns, payload);

    // 2. Update Employee
    const updates = Object.keys(payload);
    if (updates.length > 0) {
      const setClause = updates.map((key, idx) => `${key} = $${idx + 1}`).join(", ");
      const values = updates.map(k => payload[k]);
      
      const result = await client.query(
        `UPDATE ${EMPLOYEE_TABLE} SET ${setClause} WHERE id = $${updates.length + 1} AND org_id = $${updates.length + 2} RETURNING *`,
        [...values, id, orgId]
      );

      if (!result.rows.length) {
        await client.query("ROLLBACK");
        res.status(404).json({ success: false, message: "Staff not found" });
        return;
      }
    }

    // 3. Sync Dependants
    if (req.body.dependants) {
      try {
        const dependants = JSON.parse(String(req.body.dependants));
        if (Array.isArray(dependants)) {
          await client.query(`DELETE FROM institute.institute_employee_dependants WHERE employee_id = $1`, [id]);
          for (const dep of dependants) {
            if (!dep.fullname) continue;
            await client.query(
              `INSERT INTO institute.institute_employee_dependants (employee_id, fullname, relation, age, phone, email)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [id, dep.fullname, dep.relation, dep.age, dep.phone, dep.email]
            );
          }
        }
      } catch (e) {
        console.error("Failed to parse dependants JSON:", e);
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Staff updated successfully" });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Update employee error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to update staff" });
  } finally {
    client.release();
  }
});

app.delete("/api/employees/:id", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  try {
    const result = await pool.query(
      `DELETE FROM ${EMPLOYEE_TABLE} WHERE id = $1 AND org_id = $2`,
      [id, orgId]
    );

    if (!result.rowCount) {
      res.status(404).json({ success: false, message: "Staff not found" });
      return;
    }

    res.json({ success: true, message: "Staff deleted successfully" });
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({ success: false, message: "Failed to delete staff" });
  }
});

// Vehicles
app.get("/api/vehicles", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { page, perPage, offset } = getPagination(req);

  try {
    const rows = await fetchRowsWithOrgFallback(VEHICLE_TABLE, orgId);
    const total = rows.length;
    const paged = rows.slice(offset, offset + perPage).map((row: any) => normalizeVehicleRow(row));
    res.json(paginatedPayload(paged, page, perPage, total));
  } catch {
    res.json(paginatedPayload([], page, perPage, 0));
  }
});

app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const vehicleCountQuery = await pool.query(
      `SELECT COUNT(*)::int as count FROM ${VEHICLE_TABLE} WHERE org_id = $1`,
      [orgId]
    );
    const employeeCountQuery = await pool.query(
      `SELECT COUNT(*)::int as count FROM ${EMPLOYEE_TABLE} WHERE org_id = $1`,
      [orgId]
    );
    const driverCountQuery = await pool.query(
      `SELECT COUNT(*)::int as count FROM ${DRIVER_TABLE} WHERE org_id = $1`,
      [orgId]
    );

    res.json({
      success: true,
      data: {
        vehicleCount: vehicleCountQuery.rows[0]?.count || 0,
        employeeCount: employeeCountQuery.rows[0]?.count || 0,
        driverCount: driverCountQuery.rows[0]?.count || 0,
        deviceCount: 42
      }
    });
  } catch (err) {
    console.error("Dashboard Stats Fetch Error:", err);
    res.json({
      success: true,
      data: {
        vehicleCount: 0,
        employeeCount: 0,
        driverCount: 0,
        deviceCount: 0
      }
    });
  }
});

app.get("/api/vehicles/live/location/:tenantId", async (req: Request, res: Response) => {
  const orgId = req.params.tenantId;
  
  try {
    const rows = await fetchRowsWithOrgFallback(VEHICLE_TABLE, orgId);
    
    // Transform rows to include a "gps" object for the dashboard map
    const liveVehicles = rows.map(v => ({
      id: v.id,
      vehicle_name: v.vehicle_name || v.vehicle_number || "Unnamed Vehicle",
      vehicle_number: v.vehicle_number,
      battery: v.battery || 85,
      status: v.status || "active",
      gps: {
        lat: Number(v.lat) || 12.9716, // Default to Bangalore if missing
        lng: Number(v.lng) || 77.5946,
        speed: Number(v.speed) || 0,
        timestamp: v.last_gps_update || new Date().toISOString()
      },
      beacons: [] // Drivers/Passengers will be linked here if needed
    }));

    res.json({
      success: true,
      data: liveVehicles
    });
  } catch (err) {
    console.error("Live Location Fetch Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch live locations" });
  }
});

app.get("/api/vehicles/:id", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Invalid vehicle id" });
    return;
  }

  try {
    const columns = await getTableColumns(VEHICLE_TABLE);
    if (columns.has("org_id")) {
      const scoped = await pool.query(`SELECT * FROM ${VEHICLE_TABLE} WHERE org_id = $1 AND id = $2 LIMIT 1`, [orgId, id]);
      if (scoped.rows.length) {
        res.json({ success: true, data: normalizeVehicleRow(scoped.rows[0]) });
        return;
      }
    }

    const all = await pool.query(`SELECT * FROM ${VEHICLE_TABLE} WHERE id = $1 LIMIT 1`, [id]);
    if (!all.rows.length) {
      res.status(404).json({ success: false, message: "Vehicle not found" });
      return;
    }

    res.json({ success: true, data: normalizeVehicleRow(all.rows[0]) });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch vehicle" });
  }
});

app.post("/api/vehicles", upload.any(), async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const vehicleNumber = String(req.body?.vehicle_number || "").trim();
  if (!vehicleNumber) {
    res.status(400).json({ success: false, message: "vehicle_number is required" });
    return;
  }

  try {
    const columns = await getTableColumns(VEHICLE_TABLE);
    const payload = toVehiclePayload(req.body as Record<string, unknown>, columns);
    if (columns.has("vehicle_number")) payload.vehicle_number = vehicleNumber;
    if (columns.has("org_id")) payload.org_id = orgId;
    if (columns.has("status") && !payload.status) payload.status = "active";
    if (columns.has("created_at")) payload.created_at = new Date().toISOString();
    if (columns.has("updated_at")) payload.updated_at = new Date().toISOString();

    // Handle files (Azure Blob Storage)
    await processFiles(req.files, columns, payload);

    const insertColumns = Object.keys(payload);
    if (!insertColumns.length) {
      res.status(400).json({ success: false, message: "No valid vehicle fields to save" });
      return;
    }

    const placeholders = insertColumns.map((_, idx) => `$${idx + 1}`).join(", ");
    const values = insertColumns.map((key) => payload[key]);

    const result = await pool.query(
      `INSERT INTO ${VEHICLE_TABLE} (${insertColumns.join(", ")})
       VALUES (${placeholders})
       RETURNING *`,
      values
    );
    res.status(201).json({ success: true, data: normalizeVehicleRow(result.rows[0]), message: "Vehicle created successfully" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || "Failed to create vehicle" });
  }
});

app.put("/api/vehicles/:id", upload.any(), async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Invalid vehicle id" });
    return;
  }

  try {
    const columns = await getTableColumns(VEHICLE_TABLE);
    const payload = toVehiclePayload(req.body as Record<string, unknown>, columns);
    if (columns.has("updated_at")) payload.updated_at = new Date().toISOString();

    // Handle files (Azure Blob Storage)
    await processFiles(req.files, columns, payload);

    const updates = Object.keys(payload);
    if (!updates.length) {
      res.status(400).json({ success: false, message: "No fields provided for update" });
      return;
    }

    const setClause = updates.map((key, idx) => `${key} = $${idx + 1}`).join(", ");
    const values = updates.map((key) => payload[key]);

    const whereClause = columns.has("org_id")
      ? `id = $${values.length + 1} AND org_id = $${values.length + 2}`
      : `id = $${values.length + 1}`;

    const params = columns.has("org_id")
      ? [...values, id, orgId]
      : [...values, id];

    const result = await pool.query(
      `UPDATE ${VEHICLE_TABLE}
       SET ${setClause}
       WHERE ${whereClause}
       RETURNING *`,
      params
    );

    if (!result.rows.length) {
      res.status(404).json({ success: false, message: "Vehicle not found" });
      return;
    }

    res.json({ success: true, data: normalizeVehicleRow(result.rows[0]), message: "Vehicle updated successfully" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || "Failed to update vehicle" });
  }
});

app.delete("/api/vehicles/:id", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Invalid vehicle id" });
    return;
  }

  try {
    const columns = await getTableColumns(VEHICLE_TABLE);
    const result = columns.has("org_id")
      ? await pool.query(`DELETE FROM ${VEHICLE_TABLE} WHERE org_id = $1 AND id = $2`, [orgId, id])
      : await pool.query(`DELETE FROM ${VEHICLE_TABLE} WHERE id = $1`, [id]);
    if (!result.rowCount) {
      res.status(404).json({ success: false, message: "Vehicle not found" });
      return;
    }
    res.json({ success: true, message: "Vehicle deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete vehicle" });
  }
});

// Drivers
app.get("/api/drivers", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { page, perPage, offset } = getPagination(req);

  try {
    const rows = await fetchRowsWithOrgFallback(DRIVER_TABLE, orgId);
    const total = rows.length;
    const paged = rows.slice(offset, offset + perPage);
    res.json(paginatedPayload(paged, page, perPage, total));
  } catch {
    res.json(paginatedPayload([], page, perPage, 0));
  }
});

app.get("/api/drivers/:id", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Invalid driver id" });
    return;
  }

  try {
    let driverData: any = null;
    
    const scoped = await pool.query(`SELECT * FROM ${DRIVER_TABLE} WHERE org_id = $1 AND id = $2 LIMIT 1`, [orgId, id]);
    if (scoped.rows.length) {
      driverData = scoped.rows[0];
    } else {
      const all = await pool.query(`SELECT * FROM ${DRIVER_TABLE} WHERE id = $1 LIMIT 1`, [id]);
      if (!all.rows.length) {
        res.status(404).json({ success: false, message: "Driver not found" });
        return;
      }
      driverData = all.rows[0];
    }

    const licenses = await pool.query(`SELECT * FROM institute.institute_driver_license_insurance WHERE driver_id = $1`, [id]);
    driverData.license_insurance = licenses.rows;

    res.json({ success: true, data: driverData });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch driver" });
  }
});

app.post("/api/drivers", upload.any(), async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const columns = await getTableColumns(DRIVER_TABLE);

  const payload = toDriverPayload(req.body as Record<string, unknown>, columns);
  if (columns.has("org_id")) payload.org_id = orgId;
  if (columns.has("created_at")) payload.created_at = new Date();
  if (columns.has("updated_at")) payload.updated_at = new Date();

  // Attach uploaded files (Azure Blob Storage)
  await processFiles(req.files, columns, payload);

  try {
    const keys = Object.keys(payload);
    const vals = Object.values(payload);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    
    if (keys.length === 0) {
       res.status(400).json({ success: false, message: "No driver provided" });
       return;
    }

    const result = await pool.query(
      `INSERT INTO ${DRIVER_TABLE} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      vals
    );

    const driverId = result.rows[0].id;
    if (req.body.license_insurance) {
      try {
        const licenses = JSON.parse(String(req.body.license_insurance));
        if (Array.isArray(licenses)) {
          for (const lic of licenses) {
            if (!lic.type) continue;
            await pool.query(
              `INSERT INTO institute.institute_driver_license_insurance (driver_id, type, number, issue_date, exp_date)
               VALUES ($1, $2, $3, $4, $5)`,
              [driverId, lic.type, lic.number, lic.issue_date || null, lic.exp_date || null]
            );
          }
        }
      } catch (err) {
        console.error("License parse error", err);
      }
    }

    res.status(201).json({ success: true, data: result.rows[0], message: "Driver created successfully" });
  } catch (e: any) {
    console.error("CREATE DRIVER ERROR:", e);
    res.status(500).json({ success: false, message: e?.message || "Failed to create driver" });
  }
});

app.put("/api/drivers/:id", upload.any(), async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Invalid driver id" });
    return;
  }

  const columns = await getTableColumns(DRIVER_TABLE);

  const payload = toDriverPayload(req.body as Record<string, unknown>, columns);
  if (columns.has("updated_at")) payload.updated_at = new Date();

  // Update files (Azure Blob Storage)
  await processFiles(req.files, columns, payload);

  if (Object.keys(payload).length === 0) {
    res.json({ success: true, message: "No changes detected" });
    return;
  }

  try {
    const setClause = generateSetClause(payload, columns.has("org_id") ? 3 : 2);
    const params = [
      ...Object.values(payload),
      ...(columns.has("org_id") ? [id, orgId] : [id])
    ];
    
    // Switch parameters based on id and org placement in the query
    const whereClause = columns.has("org_id") ? `id = $1 AND org_id = $2` : `id = $1`;
    const finalParams = columns.has("org_id") ? [id, orgId, ...Object.values(payload)] : [id, ...Object.values(payload)];

    const finalSetClause = generateSetClause(payload, columns.has("org_id") ? 3 : 2);

    const result = await pool.query(
      `UPDATE ${DRIVER_TABLE}
       SET ${finalSetClause}
       WHERE ${whereClause}
       RETURNING *`,
      finalParams
    );

    if (!result.rows.length) {
      res.status(404).json({ success: false, message: "Driver not found" });
      return;
    }

    if (req.body.license_insurance) {
      try {
        const licenses = JSON.parse(String(req.body.license_insurance));
        if (Array.isArray(licenses)) {
          await pool.query(`DELETE FROM institute.institute_driver_license_insurance WHERE driver_id = $1`, [id]);
          for (const lic of licenses) {
            if (!lic.type) continue;
            await pool.query(
              `INSERT INTO institute.institute_driver_license_insurance (driver_id, type, number, issue_date, exp_date)
               VALUES ($1, $2, $3, $4, $5)`,
              [id, lic.type, lic.number, lic.issue_date || null, lic.exp_date || null]
            );
          }
        }
      } catch (err) {
        console.error("License parse error", err);
      }
    }

    res.json({ success: true, data: result.rows[0], message: "Driver updated successfully" });
  } catch (e: any) {
    console.error("UPDATE DRIVER ERROR:", e);
    res.status(500).json({ success: false, message: e?.message || "Failed to update driver" });
  }
});


app.get("/api/devices", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const beaconsRes = await pool.query(
      `SELECT id, device_id, sequence_id, assigned_to, assigned_type, status, device_type, battery_level, battery_status, device_health, is_active, created_at, synced_at 
       FROM devices.beacons 
       WHERE org_id = $1 
       ORDER BY device_id ASC`,
      [Number(orgId)]
    );

    const gpsRes = await pool.query(
      `SELECT id, device_id, sim_number, network_provider, device_health, status, assigned_to, assigned_type, is_active, synced_at 
       FROM devices.gps 
       WHERE org_id = $1 
       ORDER BY device_id ASC`,
      [Number(orgId)]
    );

    const enrichDevices = async (devices: any[]) => {
      const enriched = [];
      for (const dev of devices) {
        let assignedToName = null;
        if (dev.assigned_to && dev.assigned_type) {
          const idVal = Number(dev.assigned_to);
          if (Number.isFinite(idVal)) {
            if (dev.assigned_type === "staff") {
              const r = await pool.query(
                `SELECT first_name, last_name FROM institute.institute_employees WHERE id = $1 LIMIT 1`,
                [idVal]
              );
              if (r.rows.length) {
                assignedToName = `${r.rows[0].first_name} ${r.rows[0].last_name}`.trim();
              }
            } else if (dev.assigned_type === "driver") {
              const r = await pool.query(
                `SELECT first_name, last_name FROM institute.institute_drivers WHERE id = $1 LIMIT 1`,
                [idVal]
              );
              if (r.rows.length) {
                assignedToName = `${r.rows[0].first_name} ${r.rows[0].last_name}`.trim();
              }
            } else if (dev.assigned_type === "vehicle") {
              const r = await pool.query(
                `SELECT vehicle_number, vehicle_name FROM institute.institute_vehicles WHERE id = $1 LIMIT 1`,
                [idVal]
              );
              if (r.rows.length) {
                assignedToName = r.rows[0].vehicle_number || r.rows[0].vehicle_name;
              }
            }
          }
        }
        enriched.push({
          ...dev,
          assigned_to_name: assignedToName,
        });
      }
      return enriched;
    };

    const beaconsEnriched = await enrichDevices(beaconsRes.rows);
    const gpsEnriched = await enrichDevices(gpsRes.rows);

    res.json({
      success: true,
      data: {
        beacons: beaconsEnriched,
        gpsDevices: gpsEnriched,
      },
    });
  } catch (err) {
    console.error("Fetch devices error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch devices" });
  }
});

app.post("/api/devices/assign", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { deviceType, deviceId, entityType, entityId } = req.body;
  if (!deviceType || !deviceId || !entityType || !entityId) {
    res.status(400).json({ success: false, message: "Missing required fields" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const table = deviceType === "beacon" ? "devices.beacons" : "devices.gps";

    const devCheck = await client.query(
      `SELECT id FROM ${table} WHERE device_id = $1 AND org_id = $2 LIMIT 1`,
      [deviceId, Number(orgId)]
    );

    if (!devCheck.rows.length) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, message: "Device not found or not allocated to this organization" });
      return;
    }

    const deviceDbId = devCheck.rows[0].id;

    await client.query(
      `UPDATE ${table} SET assigned_to = $1, assigned_type = $2, synced_at = NOW() WHERE id = $3`,
      [String(entityId), entityType, deviceDbId]
    );

    if (entityType === "staff") {
      await client.query(
        `UPDATE institute.institute_employees SET beacon_id = $1, updated_at = NOW() WHERE id = $2 AND org_id = $3`,
        [deviceId, Number(entityId), orgId]
      );
    } else if (entityType === "driver") {
      await client.query(
        `UPDATE institute.institute_drivers SET beacon_id = $1, updated_at = NOW() WHERE id = $2 AND org_id = $3`,
        [deviceId, Number(entityId), orgId]
      );
    } else if (entityType === "vehicle") {
      if (deviceType === "gps") {
        await client.query(
          `UPDATE institute.institute_vehicles SET gps_device_id = $1, updated_at = NOW() WHERE id = $2 AND org_id = $3`,
          [deviceId, Number(entityId), orgId]
        );
      } else {
        await client.query(
          `UPDATE institute.institute_vehicles SET beacon_count = COALESCE(beacon_count, 0) + 1, updated_at = NOW() WHERE id = $2 AND org_id = $3`,
          [deviceId, Number(entityId), orgId]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Device assigned successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Assign device error:", err);
    res.status(500).json({ success: false, message: "Failed to assign device" });
  } finally {
    client.release();
  }
});

app.post("/api/devices/unassign", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { deviceType, deviceId } = req.body;
  if (!deviceType || !deviceId) {
    res.status(400).json({ success: false, message: "Missing required fields" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const table = deviceType === "beacon" ? "devices.beacons" : "devices.gps";

    const devCheck = await client.query(
      `SELECT id, assigned_to, assigned_type FROM ${table} WHERE device_id = $1 AND org_id = $2 LIMIT 1`,
      [deviceId, Number(orgId)]
    );

    if (!devCheck.rows.length) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, message: "Device not found" });
      return;
    }

    const { assigned_to, assigned_type } = devCheck.rows[0];

    await client.query(
      `UPDATE ${table} SET assigned_to = NULL, assigned_type = NULL, synced_at = NOW() WHERE device_id = $1`,
      [deviceId]
    );

    if (assigned_to && assigned_type) {
      const entityId = Number(assigned_to);
      if (assigned_type === "staff") {
        await client.query(
          `UPDATE institute.institute_employees SET beacon_id = NULL, updated_at = NOW() WHERE id = $1 AND org_id = $2`,
          [entityId, orgId]
        );
      } else if (assigned_type === "driver") {
        await client.query(
          `UPDATE institute.institute_drivers SET beacon_id = NULL, updated_at = NOW() WHERE id = $1 AND org_id = $2`,
          [entityId, orgId]
        );
      } else if (assigned_type === "vehicle") {
        if (deviceType === "gps") {
          await client.query(
            `UPDATE institute.institute_vehicles SET gps_device_id = NULL, updated_at = NOW() WHERE id = $1 AND org_id = $2`,
            [entityId, orgId]
          );
        } else {
          await client.query(
            `UPDATE institute.institute_vehicles SET beacon_count = GREATEST(COALESCE(beacon_count, 1) - 1, 0), updated_at = NOW() WHERE id = $1 AND org_id = $2`,
            [entityId, orgId]
          );
        }
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Device unassigned successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Unassign device error:", err);
    res.status(500).json({ success: false, message: "Failed to unassign device" });
  } finally {
    client.release();
  }
});

app.get("/api/gps-device/for/dropdown", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT id, device_id 
       FROM devices.gps 
       WHERE org_id = $1 AND assigned_to IS NULL 
       ORDER BY device_id ASC`,
      [Number(orgId)]
    );
    res.json(result.rows.map(row => ({
      id: row.id,
      device_id: row.device_id,
      name: row.device_id
    })));
  } catch (err) {
    console.error("Dropdown gps error:", err);
    res.json([]);
  }
});

app.get("/api/beacon-device/for/dropdown", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT id, device_id 
       FROM devices.beacons 
       WHERE org_id = $1 AND assigned_to IS NULL 
       ORDER BY device_id ASC`,
      [Number(orgId)]
    );
    res.json(result.rows.map(row => ({
      id: row.id,
      device_id: row.device_id,
      name: row.device_id
    })));
  } catch (err) {
    console.error("Dropdown beacons error:", err);
    res.json([]);
  }
});

app.get("/api/active-vehicles/for/dropdown", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const rows = await fetchRowsWithOrgFallback(VEHICLE_TABLE, orgId);
    const active = rows
      .filter((row: any) => String(row.status || "active").toLowerCase() === "active")
      .map((row: any) => ({
        id: row.id,
        vehicle_number: row.vehicle_number,
        vehicle_name: row.vehicle_name || row.vehicle_number,
      }));
    res.json(active);
  } catch {
    res.json([]);
  }
});

app.delete("/api/drivers/:id", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Invalid driver id" });
    return;
  }

  try {
    const result = await pool.query(`DELETE FROM ${DRIVER_TABLE} WHERE org_id = $1 AND id = $2`, [orgId, id]);
    if (!result.rowCount) {
      res.status(404).json({ success: false, message: "Driver not found" });
      return;
    }
    res.json({ success: true, message: "Driver deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete driver" });
  }
});

// Roles & permissions endpoints (pre-refactor style, inline)
const AVAILABLE_PERMISSIONS = [
  { id: 1, name: "manage-fleet" },
  { id: 2, name: "view-reports" },
  { id: 3, name: "manage-staff" },
  { id: 4, name: "manage-drivers" },
  { id: 5, name: "manage-roles" },
  { id: 6, name: "view-dashboard" }
];

app.get("/api/roles", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, org_id, name, description, created_at, updated_at,
       jsonb_array_length(COALESCE(permissions, '[]'::jsonb)) as permissions_count
       FROM ${ROLE_TABLE} 
       WHERE org_id = $1 
       ORDER BY id DESC`,
      [orgId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Fetch roles error:", err);
    res.json({ success: true, data: [] });
  }
});

app.post("/api/roles", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const name = String(req.body?.name || "").trim();
  const description = req.body?.description ? String(req.body.description) : null;
  const pIds = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
  
  // Convert IDs from frontend to human-readable string names for the DB
  const permissionNames = AVAILABLE_PERMISSIONS.filter(p => pIds.includes(p.id)).map(p => p.name);

  if (!name) {
    res.status(400).json({ success: false, message: "Role name is required" });
    return;
  }

  try {
    const roleResult = await pool.query(
      `INSERT INTO ${ROLE_TABLE} (org_id, name, description, permissions) VALUES ($1, $2, $3, $4) RETURNING id, org_id, name, description, created_at, updated_at`,
      [orgId, name, description, JSON.stringify(permissionNames)]
    );
    res.status(201).json({ success: true, data: roleResult.rows[0], message: "Role created successfully" });
  } catch (e: any) {
    if (e?.code === "23505") {
      res.status(409).json({ success: false, message: "Role already exists" });
      return;
    }
    console.error("Create role error:", e);
    res.status(500).json({ success: false, message: "Failed to create role" });
  }
});

app.get("/api/roles/:id", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const roleId = Number(req.params.id);
  if (!Number.isFinite(roleId)) {
    res.status(400).json({ success: false, message: "Invalid role id" });
    return;
  }

  try {
    const roleResult = await pool.query(
      `SELECT id, org_id, name, description, permissions, created_at, updated_at FROM ${ROLE_TABLE} WHERE org_id = $1 AND id = $2 LIMIT 1`,
      [orgId, roleId]
    );

    if (!roleResult.rows.length) {
      res.status(404).json({ success: false, message: "Role not found" });
      return;
    }

    const role = roleResult.rows[0];
    const pNames = Array.isArray(role.permissions) ? role.permissions : [];
    
    // the frontend expects objects for permissions property (so map string names back to full objects)
    role.permissions = AVAILABLE_PERMISSIONS.filter(p => pNames.includes(p.name));

    res.json({ success: true, data: role });
  } catch (err) {
    console.error("Fetch role detail error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch role" });
  }
});

app.put("/api/roles/:id", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const roleId = Number(req.params.id);
  const name = req.body?.name ? String(req.body.name).trim() : null;
  const description = req.body?.description !== undefined ? String(req.body.description || null) : null;
  const pIds = Array.isArray(req.body?.permissions) ? req.body.permissions : null;
  
  // Convert IDs to strings for the DB if permissions are being updated
  const permissionNames = pIds !== null 
    ? AVAILABLE_PERMISSIONS.filter(p => pIds.includes(p.id)).map(p => p.name)
    : null;

  if (!Number.isFinite(roleId)) {
    res.status(400).json({ success: false, message: "Invalid role id" });
    return;
  }

  try {
    let query = `UPDATE ${ROLE_TABLE} SET name = COALESCE($3, name), updated_at = NOW()`;
    const params: any[] = [orgId, roleId, name];

    if (description !== null) {
      params.push(description);
      query += `, description = $${params.length}`;
    }

    if (permissionNames !== null) {
      params.push(JSON.stringify(permissionNames));
      query += `, permissions = $${params.length}`;
    }

    query += ` WHERE org_id = $1 AND id = $2 RETURNING id, org_id, name, description, created_at, updated_at`;

    const updateResult = await pool.query(query, params);

    if (!updateResult.rows.length) {
      res.status(404).json({ success: false, message: "Role not found" });
      return;
    }

    res.json({ success: true, data: updateResult.rows[0], message: "Role updated successfully" });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
});

app.delete("/api/roles/:id", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const roleId = Number(req.params.id);
  if (!Number.isFinite(roleId)) {
    res.status(400).json({ success: false, message: "Invalid role id" });
    return;
  }

  try {
    const result = await pool.query(`DELETE FROM ${ROLE_TABLE} WHERE org_id = $1 AND id = $2`, [orgId, roleId]);
    if (!result.rowCount) {
      res.status(404).json({ success: false, message: "Role not found" });
      return;
    }
    res.json({ success: true, message: "Role deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete role" });
  }
});

app.get("/api/permissions", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  res.json({ success: true, data: AVAILABLE_PERMISSIONS });
});

// Master endpoints
app.get("/api/masters/forms/dropdowns/fields", (req: Request, res: Response) => {
  const type = String(req.query.type || "").toLowerCase();
  const field = String(req.query.field || "").toLowerCase();
  const key = `${type}:${field}`;
  const values = dropdownValues[key] || [];

  res.json(
    values.map((value, index) => ({
      id: index + 1,
      type,
      field,
      value,
    }))
  );
});

app.get("/api/masters/forms/dropdowns/states", (_req: Request, res: Response) => {
  res.json(stateDistrictSeed);
});

app.get("/api/masters/forms/dropdowns/districts/:state", (req: Request, res: Response) => {
  const state = String(req.params.state || "").toLowerCase();
  const districts = stateDistrictSeed.filter((item) => item.state.toLowerCase() === state);
  res.json(districts);
});

app.get("/api/stats/summary", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalVehicles: 0,
      activeVehicles: 0,
      totalStaff: 0,
      activeTrips: 0,
    },
  });
});

// --- COMPLIANCE ENDPOINTS ---

app.get("/api/compliance", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { page, perPage, offset } = getPagination(req);

  try {
    const totalResult = await pool.query(`SELECT COUNT(*) as count FROM ${COMPLIANCE_TABLE} WHERE org_id = $1`, [orgId]);
    const total = parseInt(totalResult.rows[0].count);

    const rows = await pool.query(
      `SELECT * FROM ${COMPLIANCE_TABLE} WHERE org_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3`,
      [orgId, perPage, offset]
    );

    res.json(paginatedPayload(rows.rows, page, perPage, total));
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/compliance/:id", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const result = await pool.query(`SELECT * FROM ${COMPLIANCE_TABLE} WHERE org_id = $1 AND id = $2`, [orgId, req.params.id]);
    if (!result.rowCount) {
      res.status(404).json({ success: false, message: "Compliance record not found" });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post("/api/compliance", upload.any(), async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const columns = await getTableColumns(COMPLIANCE_TABLE);
  const payload: any = { org_id: orgId };

  Object.keys(req.body).forEach(key => {
    if (columns.has(key)) {
      payload[key] = req.body[key];
    }
  });

  // Handle files (Azure Blob Storage)
  await processFiles(req.files, columns, payload);

  try {
    const keys = Object.keys(payload);
    const values = Object.values(payload);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

    const result = await pool.query(
      `INSERT INTO ${COMPLIANCE_TABLE} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    res.status(201).json({ success: true, data: result.rows[0], message: "Compliance record created" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.put("/api/compliance/:id", upload.any(), async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = req.params.id;
  const columns = await getTableColumns(COMPLIANCE_TABLE);
  const payload: any = { updated_at: new Date() };

  Object.keys(req.body).forEach(key => {
    if (columns.has(key)) {
      payload[key] = req.body[key];
    }
  });

  // Handle files (Azure Blob Storage)
  await processFiles(req.files, columns, payload);

  try {
    const keys = Object.keys(payload);
    const values = Object.values(payload);
    const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(", ");

    const result = await pool.query(
      `UPDATE ${COMPLIANCE_TABLE} SET ${setClause} WHERE id = $1 AND org_id = $2 RETURNING *`,
      [id, orgId, ...values]
    );

    if (!result.rowCount) {
      res.status(404).json({ success: false, message: "Record not found" });
      return;
    }

    res.json({ success: true, data: result.rows[0], message: "Compliance record updated" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.delete("/api/compliance/:id", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const result = await pool.query(`DELETE FROM ${COMPLIANCE_TABLE} WHERE id = $1 AND org_id = $2`, [req.params.id, orgId]);
    if (!result.rowCount) {
      res.status(404).json({ success: false, message: "Record not found" });
      return;
    }
    res.json({ success: true, message: "Record deleted" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Organization Settings
app.get("/api/organization/me", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  console.log(`[DEBUG] Fetching org settings. orgId from request:`, orgId);
  
  if (!orgId) {
    console.warn(`[DEBUG] No orgId found in request headers.`);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const client = await pool.connect();
  try {
    // 1. Fetch basic org info
    console.log(`[DEBUG] Querying organizations for id: ${orgId}`);
    let orgRes = await client.query("SELECT * FROM organizations WHERE id::text = $1", [String(orgId)]);
    
    // Fallback: If not found, try to get the first one (helpful for superadmins or dev mode)
    if (orgRes.rows.length === 0) {
      console.log(`[DEBUG] Org ${orgId} not found. Falling back to first available organization.`);
      orgRes = await client.query("SELECT * FROM organizations ORDER BY id ASC LIMIT 1");
    }

    if (orgRes.rows.length === 0) {
      console.error(`[DEBUG] No organizations found in database even after fallback.`);
      res.status(404).json({ message: "No organizations found in database" });
      return;
    }
    const org = orgRes.rows[0];
    const actualOrgId = org.id; 
    console.log(`[DEBUG] Found organization: ${org.name} (ID: ${actualOrgId})`);

    // 2. Fetch address
    const addrRes = await client.query("SELECT * FROM organization_address WHERE org_id::text = $1", [String(actualOrgId)]);
    org.address = addrRes.rows[0] || {};
    console.log(`[DEBUG] Address rows: ${addrRes.rows.length}`);

    // 3. Fetch contacts
    const contactRes = await client.query("SELECT * FROM organization_contacts WHERE org_id::text = $1", [String(actualOrgId)]);
    org.contact = contactRes.rows[0] || {};
    console.log(`[DEBUG] Contact rows: ${contactRes.rows.length}`);

    // 4. Fetch institute specific info
    const instRes = await client.query("SELECT * FROM organization_institute WHERE org_id::text = $1", [String(actualOrgId)]);
    org.institute = instRes.rows[0] || {};
    console.log(`[DEBUG] Institute rows: ${instRes.rows.length}`);

    // 5. Fetch documents
    const docRes = await client.query("SELECT * FROM organization_documents WHERE org_id::text = $1", [String(actualOrgId)]);
    org.documents = docRes.rows[0] || {};
    console.log(`[DEBUG] Documents rows: ${docRes.rows.length}`);

    res.json({ success: true, data: org });
  } catch (err: any) {
    console.error("[DEBUG] Fetch org settings error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch organization details" });
  } finally {
    client.release();
  }
});

app.put("/api/organization/me", upload.any(), async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { name, website, phone, email, gst_number, pan_number, address, contact, documents, institute } = req.body;
  
  // Handle files (Azure Blob Storage)
  const docColumns = new Set([
    "pan_card", "gst_cert", "registration_cert", "aadhaar_card", "bank_proof", 
    "contract_doc", "insurance_cert", "safety_sop", "additional_doc"
  ]);
  const docPayload: any = documents ? (typeof documents === 'string' ? JSON.parse(documents) : documents) : {};
  await processFiles(req.files, docColumns, docPayload);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Update basic org info (including Tax IDs)
    // Map phone/email from contact if they are missing at top level
    const parsedContact = typeof contact === 'string' ? JSON.parse(contact) : contact;
    const finalPhone = phone || parsedContact?.primary_phone;
    const finalEmail = email || parsedContact?.primary_email;

    await client.query(
      "UPDATE organizations SET name = $1, website = $2, phone = $3, email = $4, gst_number = $5, pan_number = $6 WHERE id::text = $7",
      [name, website, finalPhone, finalEmail, gst_number, pan_number, String(orgId)]
    );

    // 2. Upsert address
    if (address) {
      const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
      await client.query(
        `INSERT INTO organization_address (org_id, address1, address2, city, district, pincode, state)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (org_id) DO UPDATE SET
         address1 = EXCLUDED.address1,
         address2 = EXCLUDED.address2,
         city = EXCLUDED.city,
         district = EXCLUDED.district,
         pincode = EXCLUDED.pincode,
         state = EXCLUDED.state`,
        [Number(orgId), parsedAddress.address1, parsedAddress.address2, parsedAddress.city, parsedAddress.district, parsedAddress.pincode, parsedAddress.state]
      );
    }

    // 3. Upsert contact
    if (parsedContact) {
      await client.query(
        `INSERT INTO organization_contacts (
           org_id, primary_name, primary_phone, primary_email, 
           secondary_name, secondary_phone, secondary_email,
           emergency_name, emergency_phone
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (org_id) DO UPDATE SET
         primary_name = EXCLUDED.primary_name,
         primary_phone = EXCLUDED.primary_phone,
         primary_email = EXCLUDED.primary_email,
         secondary_name = EXCLUDED.secondary_name,
         secondary_phone = EXCLUDED.secondary_phone,
         secondary_email = EXCLUDED.secondary_email,
         emergency_name = EXCLUDED.emergency_name,
         emergency_phone = EXCLUDED.emergency_phone`,
        [
          Number(orgId), 
          parsedContact.primary_name, parsedContact.primary_phone, parsedContact.primary_email,
          parsedContact.secondary_name, parsedContact.secondary_phone, parsedContact.secondary_email,
          parsedContact.emergency_name, parsedContact.emergency_phone
        ]
      );
    }

    // 4. Upsert documents
    if (docPayload && Object.keys(docPayload).length > 0) {
      await client.query(
        `INSERT INTO organization_documents (
           org_id, pan_card, gst_cert, registration_cert, aadhaar_card, 
           bank_proof, contract_doc, insurance_cert, safety_sop, additional_doc
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (org_id) DO UPDATE SET
         pan_card = EXCLUDED.pan_card,
         gst_cert = EXCLUDED.gst_cert,
         registration_cert = EXCLUDED.registration_cert,
         aadhaar_card = EXCLUDED.aadhaar_card,
         bank_proof = EXCLUDED.bank_proof,
         contract_doc = EXCLUDED.contract_doc,
         insurance_cert = EXCLUDED.insurance_cert,
         safety_sop = EXCLUDED.safety_sop,
         additional_doc = EXCLUDED.additional_doc`,
        [
          Number(orgId),
          docPayload.pan_card || null, docPayload.gst_cert || null, docPayload.registration_cert || null, docPayload.aadhaar_card || null,
          docPayload.bank_proof || null, docPayload.contract_doc || null, docPayload.insurance_cert || null, docPayload.safety_sop || null, docPayload.additional_doc || null
        ]
      );
    }

    // 5. Upsert institute
    const parsedInstitute = typeof institute === 'string' ? JSON.parse(institute) : institute;
    if (parsedInstitute) {
      const { institution_type, affiliation_board, udise_code, safety_officer_name, safety_officer_contact } = parsedInstitute;
      await client.query(
        `INSERT INTO organization_institute (org_id, institution_type, affiliation_board, udise_code, safety_officer_name, safety_officer_contact)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (org_id) DO UPDATE SET
         institution_type = EXCLUDED.institution_type,
         affiliation_board = EXCLUDED.affiliation_board,
         udise_code = EXCLUDED.udise_code,
         safety_officer_name = EXCLUDED.safety_officer_name,
         safety_officer_contact = EXCLUDED.safety_officer_contact`,
        [Number(orgId), institution_type, affiliation_board, udise_code, safety_officer_name, safety_officer_contact]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Organization updated successfully" });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Update org settings error:", err);
    res.status(500).json({ success: false, message: "Failed to update organization details" });
  } finally {
    client.release();
  }
});

// Bulk Communication
app.get("/api/broadcasts/stats", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(delivered_count), 0) as total_sent,
        CASE WHEN SUM(delivered_count) > 0 
          THEN ROUND(SUM(opened_count)::numeric / SUM(delivered_count) * 100) 
          ELSE 0 
        END as open_rate
      FROM institute.institute_broadcasts
      WHERE org_id = $1
    `, [Number(orgId)]);

    res.json({
      success: true,
      data: {
        totalSent: parseInt(result.rows[0].total_sent, 10),
        openRate: parseInt(result.rows[0].open_rate, 10)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/api/broadcasts", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) return res.status(401).json({ message: "Unauthorized" });

  const { page, perPage, offset } = getPagination(req);

  try {
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM institute.institute_broadcasts WHERE org_id = $1
    `, [Number(orgId)]);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(`
      SELECT * FROM institute.institute_broadcasts 
      WHERE org_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [Number(orgId), perPage, offset]);

    res.json(paginatedPayload(result.rows, page, perPage, total));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/broadcasts", async (req: Request, res: Response) => {
  const orgId = getOrgIdFromRequest(req);
  if (!orgId) return res.status(401).json({ message: "Unauthorized" });

  const { target_audience, channel, subject, body: messageBody, scheduled_at, recipient_ids } = req.body;

  if (!subject || !messageBody || !target_audience) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const client = await pool.connect();
  try {
    // 0. Fetch Org Name
    const orgRes = await client.query(`SELECT name FROM public.organizations WHERE id = $1`, [Number(orgId)]);
    const senderName = orgRes.rows[0]?.name || "Institute Admin";

    // 1. Resolve Recipients
    let recipients: any[] = [];
    if (recipient_ids && Array.isArray(recipient_ids)) {
      for (const item of recipient_ids) {
        const table = item.type === 'staff' ? 'institute.institute_employees' : 'institute.institute_drivers';
        const phoneCol = item.type === 'staff' ? 'phone' : 'mobile_number as phone';
        const rRes = await client.query(`SELECT id, first_name, last_name, email, ${phoneCol} FROM ${table} WHERE id = $1 AND org_id = $2 AND email IS NOT NULL`, [item.id, Number(orgId)]);
        if (rRes.rows.length > 0) recipients.push({ ...rRes.rows[0], type: item.type === 'staff' ? 'employee' : 'driver' });
      }
    } else {
      if (target_audience === "staff" || target_audience === "everyone") {
        const r = await client.query(`SELECT id, first_name, last_name, email, phone FROM institute.institute_employees WHERE org_id = $1 AND email IS NOT NULL`, [Number(orgId)]);
        recipients.push(...r.rows.map(x => ({ ...x, type: 'employee' })));
      }
      if (target_audience === "drivers" || target_audience === "everyone") {
        const r = await client.query(`SELECT id, first_name, last_name, email, mobile_number as phone FROM institute.institute_drivers WHERE org_id = $1 AND email IS NOT NULL`, [Number(orgId)]);
        recipients.push(...r.rows.map(x => ({ ...x, type: 'driver' })));
      }
    }

    if (recipients.length === 0) return res.status(400).json({ success: false, message: "No recipients found" });

    // 2. Create Broadcast
    const broadcastRes = await client.query(`
      INSERT INTO institute.institute_broadcasts (org_id, target_audience, channel, subject, body, status, total_recipients)
      VALUES ($1, $2, $3, $4, $5, 'sending', $6) RETURNING *
    `, [Number(orgId), target_audience, channel, subject, messageBody, recipients.length]);
    const broadcast = broadcastRes.rows[0];

    // 3. Send
    let delivered = 0;
    for (const r of recipients) {
      const emailRes = await sendEmail(r.email, subject, messageBody, senderName);
      await client.query(`
        INSERT INTO institute.institute_broadcast_recipients (broadcast_id, recipient_type, recipient_id, recipient_name, recipient_email, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [broadcast.id, r.type, r.id, `${r.first_name} ${r.last_name}`, r.email, emailRes.success ? 'delivered' : 'failed']);
      if (emailRes.success) delivered++;
    }

    await client.query(`UPDATE institute.institute_broadcasts SET status = 'sent', delivered_count = $1, sent_at = NOW() WHERE id = $2`, [delivered, broadcast.id]);
    
    res.json({ success: true, data: { ...broadcast, delivered_count: delivered, status: 'sent' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send broadcast" });
  } finally {
    client.release();
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handler (to catch Multer errors and others)

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "File too large. Max limit is 5MB." });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  
  if (err.message === "Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed.") {
    return res.status(400).json({ success: false, message: err.message });
  }

  console.error("Unhandled Error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, async () => {
  let dbStatus = "disconnected";
  try {
    const conn = await pool.connect();
    conn.release();
    dbStatus = "connected";
  } catch {
    dbStatus = "disconnected";
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🚀 Institute Panel Backend (Pre-Refactor)          ║
║                                                            ║
║  Port: ${String(PORT).padEnd(52)}║
║  API URL: http://localhost:${PORT}/api${" ".repeat(40 - String(PORT).length)}║
║  DB: ${dbStatus.padEnd(54)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
