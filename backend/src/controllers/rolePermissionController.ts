import { Request, Response, NextFunction } from "express";
import * as rolePermissionService from "../services/rolePermissionService";
import { AppError } from "../middleware/errorHandler";
import type { ApiResponse, PaginatedResponse, Role, Permission } from "../types/index";

/**
 * @GET /api/roles
 * Get all roles for the user's organization
 */
export async function getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.orgId) throw new AppError(401, "Unauthorized");

    const roles = await rolePermissionService.getRoles(req.orgId);

    res.json({
      success: true,
      data: roles,
    } as ApiResponse<Role[]>);
  } catch (error) {
    next(error);
  }
}

/**
 * @GET /api/roles/:id
 * Get a specific role by ID
 */
export async function getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.orgId) throw new AppError(401, "Unauthorized");

    const roleId = parseInt(req.params.id as string, 10);
    if (isNaN(roleId)) throw new AppError(400, "Invalid role ID");

    const role = await rolePermissionService.getRoleById(req.orgId, roleId);

    res.json({
      success: true,
      data: role,
    } as ApiResponse<Role>);
  } catch (error) {
    next(error);
  }
}

/**
 * @POST /api/roles
 * Create a new role
 */
export async function createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.orgId) throw new AppError(401, "Unauthorized");

    const { name, description, permissions, department, access_level, status, created_by } = req.body;

    const role = await rolePermissionService.createRole(req.orgId, {
      name,
      description,
      permissions,
      department,
      access_level,
      status,
      created_by
    });

    res.status(201).json({
      success: true,
      data: role,
      message: "Role created successfully",
    } as ApiResponse<Role>);
  } catch (error) {
    next(error);
  }
}

/**
 * @PUT /api/roles/:id
 * Update an existing role
 */
export async function updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.orgId) throw new AppError(401, "Unauthorized");

    const roleId = parseInt(req.params.id as string, 10);
    if (isNaN(roleId)) throw new AppError(400, "Invalid role ID");

    const { name, description, permissions, department, access_level, status } = req.body;

    const role = await rolePermissionService.updateRole(req.orgId, roleId, {
      name,
      description,
      permissions,
      department,
      access_level,
      status
    });

    res.json({
      success: true,
      data: role,
      message: "Role updated successfully",
    } as ApiResponse<Role>);
  } catch (error) {
    next(error);
  }
}

/**
 * @DELETE /api/roles/:id
 * Delete a role
 */
export async function deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.orgId) throw new AppError(401, "Unauthorized");

    const roleId = parseInt(req.params.id as string, 10);
    if (isNaN(roleId)) throw new AppError(400, "Invalid role ID");

    await rolePermissionService.deleteRole(req.orgId, roleId);

    res.json({
      success: true,
      message: "Role deleted successfully",
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
}

/**
 * @GET /api/permissions
 * Get all permissions
 */
export async function getPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const permissions = await rolePermissionService.getPermissions();

    res.json({
      success: true,
      data: permissions,
    } as ApiResponse<Permission[]>);
  } catch (error) {
    next(error);
  }
}

/**
 * @POST /api/permissions
 * Create a new permission
 */
export async function createPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body;

    const permission = await rolePermissionService.createPermission(name);

    res.status(201).json({
      success: true,
      data: permission,
      message: "Permission created successfully",
    } as ApiResponse<Permission>);
  } catch (error) {
    next(error);
  }
}

/**
 * @DELETE /api/permissions/:id
 * Delete a permission
 */
export async function deletePermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const permissionId = parseInt(req.params.id as string, 10);
    if (isNaN(permissionId)) throw new AppError(400, "Invalid permission ID");

    await rolePermissionService.deletePermission(permissionId);

    res.json({
      success: true,
      message: "Permission deleted successfully",
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
}
