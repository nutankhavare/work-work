import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import tenantApi from "../Services/ApiService";

export type AuthStatus = "unauthenticated" | "authenticated" | "checking";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface OrganizationDetails {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  status?: string;
}

export interface AuthState {
  user: AuthUser | null;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
  status: AuthStatus;
  organization: OrganizationDetails | null;
}

export interface AuthContextValue extends AuthState {
  setAuthFromMe: (payload: {
    id: number;
    tenant_id: string;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
    organization?: OrganizationDetails | null;
  }) => void;
  clearAuth: () => void;
  refreshMe: () => Promise<void>;
}

const AUTH_STORAGE_KEY = "auth_state";

const initialState: AuthState = {
  user: null,
  tenantId: null,
  roles: [],
  permissions: [],
  status: "unauthenticated",
  organization: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  const setAuthFromMe: AuthContextValue["setAuthFromMe"] = useCallback((payload) => {
    const next: AuthState = {
      user: {
        id: payload.id,
        name: payload.name,
        email: payload.email,
      },
      roles: payload.roles || [],
      tenantId: payload.tenant_id,
      permissions: payload.permissions || [],
      status: "authenticated",
      organization: payload.organization || null,
    };

    setState(next);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const clearAuth: AuthContextValue["clearAuth"] = useCallback(() => {
    setState(initialState);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await tenantApi.get("/auth/refresh");
      if (res.status === 200 && res.data) {
        const responseData = res.data.data || res.data;
        const userData = responseData.user || responseData;

        // Update token if a new one was returned
        if (responseData.token) {
          localStorage.setItem("token", responseData.token);
        }

        setAuthFromMe({
          id: userData.id || 0,
          name: userData.name || userData.email || "",
          email: userData.email || "",
          roles: [userData.roleName || userData.role_name || "ORG_ADMIN"],
          permissions: userData.permissions || ["*"],
          tenant_id: String(userData.orgId || userData.org_id || ""),
          organization: userData.organization || null,
        });
      }
    } catch (error: any) {
      // Only clear if truly unauthorized
      if (error.response?.status === 401) {
        clearAuth();
      }
    }
  }, [clearAuth, setAuthFromMe]);

  // Initial hydration from localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;

      const cached = JSON.parse(raw) as AuthState | null;
      if (cached && cached.user) {
        // Provisional state from cache, then verify
        setState({
          user: cached.user,
          roles: cached.roles || [],
          permissions: cached.permissions || [],
          status: "checking",
          tenantId: cached.tenantId || null,
          organization: cached.organization || null,
        });

        void refreshMe();
      }
    } catch {
      // ignore parse/storage errors
    }
    // we intentionally exclude refreshMe from deps to avoid re-running
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    ...state,
    setAuthFromMe,
    clearAuth,
    refreshMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
