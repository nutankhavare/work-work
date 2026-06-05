import axios from "axios";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const ensureTrailingSlash = (value: string) => `${trimTrailingSlash(value)}/`;

const baseURL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "http://localhost:7071/api");
const fallbackBaseUrls = (import.meta.env.VITE_API_BASE_URL_FALLBACKS || "")
  .split(",")
  .map((url: string) => trimTrailingSlash(url))
  .filter(Boolean);
const apiOrigin = baseURL.endsWith("/api") ? baseURL.slice(0, -4) : baseURL;

export const tenantAsset = ensureTrailingSlash(
  import.meta.env.VITE_TENANT_ASSET_URL || `${apiOrigin}/tenancy/assets`,
);

export const centralAsset = ensureTrailingSlash(
  import.meta.env.VITE_CENTRAL_ASSET_URL || `${apiOrigin}/storage`,
);

export const centralUrl = trimTrailingSlash(import.meta.env.VITE_CENTRAL_API_URL || baseURL);

const tenantApi = axios.create({
  baseURL: baseURL,
  withCredentials: false, // Set to false for Azure Function App + JWT tokens
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// 2. CONFIGURE INTERCEPTOR WITH THE CORRECT LOCAL STORAGE KEY
tenantApi.interceptors.request.use(
  (config) => {
    // We will consistently use the key 'token'
    const token = localStorage.getItem("token");

    if (token) {
      // Laravel Sanctum expects the token prefixed with 'Bearer '
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// This response interceptor handles 401 errors
const isRedirecting = false;
tenantApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const isNetworkError = !error.response;
    const retryIndex = config.__retryHostIndex ?? -1;
    const canRetryFallback = isNetworkError && retryIndex < fallbackBaseUrls.length - 1;

    if (canRetryFallback) {
      const nextIndex = retryIndex + 1;
      config.__retryHostIndex = nextIndex;
      config.baseURL = fallbackBaseUrls[nextIndex];
      return tenantApi.request(config);
    }

    const url = error.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/refresh");

    if (
      error.response &&
      error.response.status === 401 &&
      !isAuthEndpoint &&
      window.location.pathname !== "/login" &&
      !isRedirecting
    ) {
      console.warn("Unauthorized access! Redirecting to login.");
      // isRedirecting = true;
      localStorage.removeItem("token");
      localStorage.removeItem("auth_state");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default tenantApi;
