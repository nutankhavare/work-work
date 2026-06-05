export type AuthStatus = "unauthenticated" | "authenticated" | "checking";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  roles: string[];
  permissions: string[];
  status: AuthStatus;
}

export interface AuthContextValue extends AuthState {
  /**
   * Set auth state from /api/me payload.
   * Should be called after a successful /me response.
   */
  setAuthFromMe: (payload: {
    id: number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
  }) => void;

  /**
   * Clear auth state completely (logout or invalid session).
   */
  clearAuth: () => void;

  /**
   * Re-fetch the current user from /api/me and update the state.
   */
  refreshMe: () => Promise<void>;
}
