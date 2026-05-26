import pool, { withRLS } from "../lib/db";
import type { Permission, Role } from "../types/index";
import { AppError } from "../middleware/errorHandler";

const ROLE_TABLE = 'institute.institute_roles';
const PERMISSION_TABLE = 'institute.institute_permissions';
const ROLE_PERMISSION_JUNCTION = 'institute.institute_role_permissions';
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

let schemaReady = false;
let schemaAttempted = false;

let inMemoryRoles: Role[] = [];
let inMemoryPermissions: Permission[] = [];

const DEFAULT_PERMISSIONS = [
  "view dashboard",
  "view role permissions",
  "create role permissions",
  "edit role permissions",
  "delete role permissions",
  "view employees",
  "create employees",
  "edit employees",
  "delete employees",
  "view vehicles",
  "create vehicles",
  "edit vehicles",
  "delete vehicles",
  "view drivers",
  "create drivers",
  "edit drivers",
  "delete drivers",
  "view travellers",
  "create travellers",
  "edit travellers",
  "delete travellers",
  "view bookings",
  "view vendors",
  "view feedbacks",
  "view reports",
  "view settings",
];

function seedInMemoryPermissions(): void {
  if (inMemoryPermissions.length > 0) return;
  inMemoryPermissions = DEFAULT_PERMISSIONS.map((name, idx) => ({ id: idx + 1, name }));
}

export async function initializeRolePermissionSchema(): Promise<void> {
  if (schemaAttempted) return;
  schemaAttempted = true;

  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS schema1`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${ROLE_TABLE} (
        id SERIAL PRIMARY KEY,
        org_id TEXT NOT NULL DEFAULT '${DEFAULT_ORG_ID}',
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${PERMISSION_TABLE} (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${ROLE_PERMISSION_JUNCTION} (
        role_id INTEGER REFERENCES ${ROLE_TABLE}(id) ON DELETE CASCADE,
        permission_id INTEGER REFERENCES ${PERMISSION_TABLE}(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    await pool.query(
      `ALTER TABLE ${ROLE_TABLE} ADD COLUMN IF NOT EXISTS org_id TEXT NOT NULL DEFAULT '${DEFAULT_ORG_ID}'`
    );

    await pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS office_roles_org_id_name_uidx ON ${ROLE_TABLE} (org_id, name)`
    );

    schemaReady = true;
    console.log("[DB] Role/Permission schema initialized");
  } catch (error: any) {
    schemaReady = false;
    seedInMemoryPermissions();
    console.warn(`[DB] Role/Permission schema unavailable; fallback mode: ${error?.message}`);
  }
}

export async function seedDefaultPermissions(): Promise<void> {
  if (!schemaReady) {
    seedInMemoryPermissions();
    return;
  }

  try {
    for (const name of DEFAULT_PERMISSIONS) {
      await pool.query(
        `INSERT INTO ${PERMISSION_TABLE} (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [name]
      );
    }
  } catch (error) {
    console.warn("[DB] Failed to seed permissions:", error);
  }
}

export async function ensureDefaultAdminRole(orgId: string): Promise<Role | void> {
  const safeOrgId = orgId || DEFAULT_ORG_ID;

  if (!schemaReady) {
    const existing = inMemoryRoles.find((r) => r.org_id === safeOrgId && r.name === "admin");
    if (existing) return existing;

    seedInMemoryPermissions();
    const role: Role = {
      id: inMemoryRoles.length + 1,
      org_id: safeOrgId,
      name: "admin",
      description: "System administrator",
      permissions: [...inMemoryPermissions],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryRoles.push(role);
    return role;
  }

  try {
    const existing = await pool.query(
      `SELECT id, org_id, name, description, created_at, updated_at
       FROM ${ROLE_TABLE}
       WHERE org_id = $1 AND name = 'admin'
       LIMIT 1`,
      [safeOrgId]
    );

    let role;
    if (existing.rows.length > 0) {
      role = existing.rows[0];
    } else {
      const inserted = await pool.query(
        `INSERT INTO ${ROLE_TABLE} (org_id, name, description, department, access_level, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, org_id, name, description, department, access_level, status, created_by, created_at, updated_at`,
        [safeOrgId, "admin", "System administrator", "Core Administration", "Root Access", "Active", "System"]
      );
      role = inserted.rows[0];
    }

    // Ensure Admin has all permissions
    const allPermissions = await getPermissions();
    for (const p of allPermissions) {
      await pool.query(
        `INSERT INTO ${ROLE_PERMISSION_JUNCTION} (role_id, permission_id) 
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [role.id, p.id]
      );
    }

    return await getRoleById(safeOrgId, role.id);
  } catch (error) {
    console.warn("[DB] Failed to ensure admin role:", error);
  }
}

export async function getRoles(orgId: string): Promise<Role[]> {
  // Always ensure default admin exists before returning roles
  await ensureDefaultAdminRole(orgId);

  if (!schemaReady) {
    return inMemoryRoles.filter((r) => r.org_id === orgId).sort((a, b) => b.id - a.id);
  }

  return withRLS(orgId, async (client) => {
    const result = await client.query(
      `SELECT r.id, r.org_id, r.name, r.description, r.department, r.access_level, r.status, r.created_by, r.created_at, r.updated_at,
              COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', p.id, 'name', p.name)) FILTER (WHERE p.id IS NOT NULL), '[]') as permissions,
              (SELECT COUNT(*) FROM institute.institute_employees WHERE org_id = $1 AND roles::jsonb @> JSONB_BUILD_ARRAY(r.name)) as assigned_users
       FROM ${ROLE_TABLE} r
       LEFT JOIN ${ROLE_PERMISSION_JUNCTION} rp ON r.id = rp.role_id
       LEFT JOIN ${PERMISSION_TABLE} p ON rp.permission_id = p.id
       WHERE r.org_id = $1
       GROUP BY r.id
       ORDER BY r.id DESC`,
      [orgId]
    );
    return result.rows as Role[];
  });
}

export async function getRoleById(orgId: string, roleId: number): Promise<Role> {
  if (!schemaReady) {
    const role = inMemoryRoles.find((r) => r.org_id === orgId && r.id === roleId);
    if (!role) throw new AppError(404, "Role not found");
    return role;
  }

  return withRLS(orgId, async (client) => {
    const result = await client.query(
      `SELECT r.id, r.org_id, r.name, r.description, r.department, r.access_level, r.status, r.created_by, r.created_at, r.updated_at,
              COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', p.id, 'name', p.name)) FILTER (WHERE p.id IS NOT NULL), '[]') as permissions,
              (SELECT COUNT(*) FROM institute.institute_employees WHERE org_id = $1 AND roles::jsonb @> JSONB_BUILD_ARRAY(r.name)) as assigned_users
       FROM ${ROLE_TABLE} r
       LEFT JOIN ${ROLE_PERMISSION_JUNCTION} rp ON r.id = rp.role_id
       LEFT JOIN ${PERMISSION_TABLE} p ON rp.permission_id = p.id
       WHERE r.org_id = $1 AND r.id = $2
       GROUP BY r.id`,
      [orgId, roleId]
    );

    if (result.rows.length === 0) throw new AppError(404, "Role not found");
    return result.rows[0] as Role;
  });
}

export async function createRole(
  orgId: string,
  data: { 
    name: string; 
    description?: string; 
    permissions?: number[];
    department?: string;
    access_level?: string;
    status?: string;
    created_by?: string;
  }
): Promise<Role> {
  if (!data.name?.trim()) throw new AppError(400, "Role name is required");

  if (!schemaReady) {
    const role: Role = {
      id: inMemoryRoles.length + 1,
      org_id: orgId,
      name: data.name.trim(),
      description: data.description ?? null,
      permissions: (data.permissions ?? []).map(id => inMemoryPermissions.find(p => p.id === id)).filter(Boolean) as Permission[],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryRoles.push(role);
    return role;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Use the client with RLS for consistency
    await client.query(`SET LOCAL app.current_org_id = $1`, [orgId]);

    const roleResult = await client.query(
      `INSERT INTO ${ROLE_TABLE} (org_id, name, description, department, access_level, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, org_id, name, description, department, access_level, status, created_by, created_at, updated_at`,
      [
        orgId, 
        data.name.trim(), 
        data.description ?? null,
        data.department ?? null,
        data.access_level ?? null,
        data.status ?? 'Active',
        data.created_by ?? 'Admin User'
      ]
    );
    
    const role = roleResult.rows[0];

    if (data.permissions && data.permissions.length > 0) {
      for (const permissionId of data.permissions) {
        await client.query(
          `INSERT INTO ${ROLE_PERMISSION_JUNCTION} (role_id, permission_id) VALUES ($1, $2)`,
          [role.id, permissionId]
        );
      }
    }

    await client.query("COMMIT");
    
    // Fetch complete role with permissions
    return await getRoleById(orgId, role.id);
  } catch (error: any) {
    await client.query("ROLLBACK");
    if (error?.code === "23505") throw new AppError(409, "Role already exists");
    throw new AppError(500, "Failed to create role");
  } finally {
    client.release();
  }
}

export async function updateRole(
  orgId: string,
  roleId: number,
  data: { 
    name?: string; 
    description?: string; 
    permissions?: number[];
    department?: string;
    access_level?: string;
    status?: string;
  }
): Promise<Role> {
  if (!schemaReady) {
    const role = inMemoryRoles.find((r) => r.org_id === orgId && r.id === roleId);
    if (!role) throw new AppError(404, "Role not found");

    if (typeof data.name === "string") role.name = data.name.trim();
    if (data.description !== undefined) role.description = data.description;
    if (data.permissions !== undefined) {
       role.permissions = (data.permissions).map(id => inMemoryPermissions.find(p => p.id === id)).filter(Boolean) as Permission[];
    }
    role.updated_at = new Date().toISOString();
    return role;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Set RLS context
    await client.query(`SET LOCAL app.current_org_id = $1`, [orgId]);

    const result = await client.query(
      `UPDATE ${ROLE_TABLE}
       SET
         name = COALESCE($3, name),
         description = COALESCE($4, description),
         department = COALESCE($5, department),
         access_level = COALESCE($6, access_level),
         status = COALESCE($7, status),
         updated_at = NOW()
       WHERE org_id = $1 AND id = $2
       RETURNING id`,
      [
        orgId, 
        roleId, 
        data.name?.trim() ?? null, 
        data.description ?? null,
        data.department ?? null,
        data.access_level ?? null,
        data.status ?? null
      ]
    );

    if (result.rows.length === 0) throw new AppError(404, "Role not found");

    // Sync permissions if provided
    if (data.permissions !== undefined) {
      // 1. Delete existing
      await client.query(`DELETE FROM ${ROLE_PERMISSION_JUNCTION} WHERE role_id = $1`, [roleId]);
      
      // 2. Insert new
      if (data.permissions.length > 0) {
        for (const permissionId of data.permissions) {
          await client.query(
            `INSERT INTO ${ROLE_PERMISSION_JUNCTION} (role_id, permission_id) VALUES ($1, $2)`,
            [roleId, permissionId]
          );
        }
      }
    }

    await client.query("COMMIT");
    return await getRoleById(orgId, roleId);
  } catch (error: any) {
    await client.query("ROLLBACK");
    if (error instanceof AppError) throw error;
    if (error?.code === "23505") throw new AppError(409, "Role already exists");
    throw new AppError(500, "Failed to update role");
  } finally {
    client.release();
  }
}

export async function deleteRole(orgId: string, roleId: number): Promise<void> {
  if (!schemaReady) {
    inMemoryRoles = inMemoryRoles.filter((r) => !(r.org_id === orgId && r.id === roleId));
    return;
  }

  await withRLS(orgId, async (client) => {
    const result = await client.query(`DELETE FROM ${ROLE_TABLE} WHERE org_id = $1 AND id = $2`, [orgId, roleId]);
    if (result.rowCount === 0) throw new AppError(404, "Role not found");
  });
}

export async function getPermissions(): Promise<Permission[]> {
  if (!schemaReady) {
    seedInMemoryPermissions();
    return [...inMemoryPermissions].sort((a, b) => a.id - b.id);
  }

  const result = await pool.query(`SELECT id, name FROM ${PERMISSION_TABLE} ORDER BY id ASC`);
  return result.rows as Permission[];
}

export async function createPermission(name: string): Promise<Permission> {
  if (!name?.trim()) throw new AppError(400, "Permission name is required");

  if (!schemaReady) {
    const permission: Permission = { id: inMemoryPermissions.length + 1, name: name.trim() };
    inMemoryPermissions.push(permission);
    return permission;
  }

  try {
    const result = await pool.query(
      `INSERT INTO ${PERMISSION_TABLE} (name) VALUES ($1) RETURNING id, name`,
      [name.trim()]
    );
    return result.rows[0] as Permission;
  } catch (error: any) {
    if (error?.code === "23505") throw new AppError(409, "Permission already exists");
    throw new AppError(500, "Failed to create permission");
  }
}

export async function deletePermission(permissionId: number): Promise<void> {
  if (!schemaReady) {
    inMemoryPermissions = inMemoryPermissions.filter((p) => p.id !== permissionId);
    return;
  }

  const result = await pool.query(`DELETE FROM ${PERMISSION_TABLE} WHERE id = $1`, [permissionId]);
  if (result.rowCount === 0) throw new AppError(404, "Permission not found");
}
