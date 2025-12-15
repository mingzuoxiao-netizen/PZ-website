
import { API_BASE } from './siteConfig';

// ✅ Link to the single source of truth
export const ADMIN_API_BASE = API_BASE;

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

  // ✅ Only set JSON content type if NOT FormData (file upload)
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // ✅ Standard Bearer Auth using the Single Source Token
  if (!skipAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Construct URL, ensuring endpoint is appended correctly to base
  let url = endpoint.startsWith("http")
    ? endpoint
    : `${ADMIN_API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (params) {
    const search = new URLSearchParams(params).toString();
    url += `${url.includes("?") ? "&" : "?"}${search}`;
  }

  const response = await fetch(url, {
    method: customConfig.method || "GET",
    ...customConfig,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    console.warn("[adminFetch] Unauthorized - Token may be invalid or expired");
    // We let the caller handle the 401/403 or global guard catches it
  }

  if (!response.ok) {
    const text = await response.text();
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
