// utils/adminFetch.ts

// ✅ Single source of truth for API host
export const ADMIN_API_BASE = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

// ✅ Single source of truth for token key
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

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // ✅ Force absolute URL (never relative)
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  let url = endpoint.startsWith("http")
    ? endpoint
    : `${ADMIN_API_BASE}/${cleanEndpoint}`;

  if (params) {
    const search = new URLSearchParams(params).toString();
    url += `${url.includes("?") ? "&" : "?"}${search}`;
  }

  // Vite-friendly debug flag
  if (import.meta.env?.DEV) {
    // console.debug(`[adminFetch] ${customConfig.method || "GET"} ${url}`);
  }

  const response = await fetch(url, {
    method: customConfig.method || "GET",
    ...customConfig,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 404) {
      throw new Error(`API Endpoint Not Found: ${url}`);
    }
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) return {} as T;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}
