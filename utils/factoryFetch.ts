
import { API_BASE } from './siteConfig';
import { ADMIN_SESSION_KEY } from './adminFetch';

export const FACTORY_API_BASE = API_BASE;

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Factory-Safe Data Fetcher
 * Strictly limited to factory-safe endpoints.
 * Uses the same session token but logically separated from Admin capabilities.
 */
export async function factoryFetch<T = any>(
  endpoint: string,
  { params, ...customConfig }: FetchOptions = {}
): Promise<T> {
  const token = sessionStorage.getItem(ADMIN_SESSION_KEY);

  const isFormData = customConfig.body instanceof FormData;

  const headers: HeadersInit = {
    ...(customConfig.headers || {}),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Construct URL
  let url = endpoint.startsWith("http")
    ? endpoint
    : `${FACTORY_API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

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
    console.warn("[factoryFetch] Unauthorized access.");
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
