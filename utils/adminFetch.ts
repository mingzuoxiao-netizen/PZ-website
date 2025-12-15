
import { API_BASE } from './siteConfig';

// ✅ STRICT HOST ENFORCEMENT
// We explicitly use the worker URL. Relative paths are forbidden for API calls.
export const ADMIN_API_BASE = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";
export const ADMIN_SESSION_KEY = "pz_auth_token";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
}

export async function adminFetch<T = any>(
  endpoint: string,
  { params, skipAuth = false, ...customConfig }: FetchOptions = {}
): Promise<T> {
  const token = sessionStorage.getItem(ADMIN_SESSION_KEY);

  const isFormData = customConfig.body instanceof FormData;

  const headers: HeadersInit = {
    ...(customConfig.headers || {}),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // ✅ Force Absolute URL Construction
  // This prevents fetches to http://localhost:5173/site-config which causes 404s
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  let url = endpoint.startsWith("http")
    ? endpoint
    : `${ADMIN_API_BASE}/${cleanEndpoint}`;

  if (params) {
    const search = new URLSearchParams(params).toString();
    url += `${url.includes("?") ? "&" : "?"}${search}`;
  }

  // Debug log for development to catch relative path slips
  if (process.env.NODE_ENV === 'development') {
      // console.debug(`[adminFetch] ${customConfig.method || 'GET'} ${url}`);
  }

  const response = await fetch(url, {
    method: customConfig.method || "GET",
    ...customConfig,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    console.warn(`[adminFetch] Unauthorized (${response.status}) on ${url}`);
  }

  if (!response.ok) {
    const text = await response.text();
    // Provide a cleaner error message for 404s
    if (response.status === 404) {
        throw new Error(`API Endpoint Not Found: ${url}`);
    }
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return await response.json();
  }

  return (await response.text()) as unknown as T;
}
