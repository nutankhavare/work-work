import { useAuth } from "../Context/AuthContext";

/**
 * Hook-based toolkit for permission/role checks.
 *
 * Usage:
 * const { can, canAny, hasRole, hasAnyRole } = useToolkit();
 * if (can('create users')) { ... }
 */

export interface Toolkit {
  /**
   * Check if the current user has the given permission.
   */
  can: (permission: string) => boolean;

  /**
   * Check if the current user has at least one of the given permissions.
   */
  canAny: (permissions: string[]) => boolean;

  /**
   * Check if the current user has the given role.
   */
  hasRole: (role: string) => boolean;

  /**
   * Check if the current user has at least one of the given roles.
   */
  hasAnyRole: (roles: string[]) => boolean;

  /**
   * Raw permissions array from auth context.
   */
  permissions: string[];

  /**
   * Raw roles array from auth context.
   */
  roles: string[];
}

/**
 * Normalize a string key for safer comparisons.
 * Keeps it simple: trim + lowercase.
 */
const normalize = (value: string): string => value.trim().toLowerCase();

/**
 * useToolkit
 *
 * Centralized helper for permission and role checks,
 * backed by AuthProvider/useAuth.
 */
export const useToolkit = (): Toolkit => {
  const { permissions, roles } = useAuth();

  const normalizedPermissions = permissions.map(normalize);
  const normalizedRoles = roles.map(normalize);

  const can = (permission: string): boolean => {
    if (!permission) return false;
    // Wildcard support: if user has '*', they can do anything
    if (normalizedPermissions.includes("*")) return true;
    const key = normalize(permission);
    return normalizedPermissions.includes(key);
  };

  const canAny = (checks: string[]): boolean => {
    if (!checks || checks.length === 0) return false;
    return checks.some((p) => can(p));
  };

  const hasRole = (role: string): boolean => {
    if (!role) return false;
    const key = normalize(role);
    return normalizedRoles.includes(key);
  };

  const hasAnyRole = (checks: string[]): boolean => {
    if (!checks || checks.length === 0) return false;
    return checks.some((r) => hasRole(r));
  };

  return {
    can,
    canAny,
    hasRole,
    hasAnyRole,
    permissions,
    roles,
  };
};

/**
 * Optional helper components for JSX usage.
 * Keep them minimal; they just wrap useToolkit.
 */

interface CanProps {
  permission: string;
  children: React.ReactNode;
}

export const Can = ({ permission, children }: CanProps) => {
  const { can } = useToolkit();
  if (!can(permission)) return null;
  return { children };
};

interface CanAnyProps {
  permissions: string[];
  children: React.ReactNode;
}

export const CanAny = ({ permissions, children }: CanAnyProps) => {
  const { canAny } = useToolkit();
  if (!canAny(permissions)) return null;
  return { children };
};

interface HasRoleProps {
  role: string;
  children: React.ReactNode;
}

export const HasRole = ({ role, children }: HasRoleProps) => {
  const { hasRole } = useToolkit();
  if (!hasRole(role)) return null;
  return { children };
};

interface HasAnyRoleProps {
  roles: string[];
  children: React.ReactNode;
}

export const HasAnyRole = ({ roles, children }: HasAnyRoleProps) => {
  const { hasAnyRole } = useToolkit();
  if (!hasAnyRole(roles)) return null;
  return { children };
};

// date time formatters ---------------

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
};

export const formatDateTime = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString)
    .toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
};

export const formatTime = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "--:--";
  }
};

export const DUMMY_USER_IMAGE = "/user.jpeg";
