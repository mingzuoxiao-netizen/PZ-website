// utils/adminFetch.ts

export const ADMIN_API_BASE = "/api";
export const ADMIN_SESSION_KEY = "pz_auth_token";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
}

function normalizeEndpoint(endpoint: string) {
  let ep = endpoint.trim();
  if (ep.startsWith("http://") || ep.startsWith("https://")) return ep;
  if (!ep.startsWith("/")) ep = `/${ep}`;
  if (ep.startsWith("/api/")) ep = ep.replace(/^\/api/, "");
  return ep;
}

export async function adminFetch<T = any>(
  endpoint: string,
  { params, skipAuth = false, ...customConfig }: FetchOptions = {}
): Promise<T> {
  const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
  const normalized = normalizeEndpoint(endpoint);

  let url =
    normalized.startsWith("http://") || normalized.startsWith("https://")
      ? normalized
      : `${ADMIN_API_BASE}${normalized}`;

  if (params) {
    const search = new URLSearchParams(params).toString();
    url += `${url.includes("?") ? "&" : "?"}${search}`;
  }

  const headers = new Headers(customConfig.headers || {});
  const isFormData = customConfig.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      method: customConfig.method || "GET",
      ...customConfig,
      headers,
    });

    if (response.status === 204) return {} as T;

    if (!response.ok) {
      let errorDetail = "";
      try {
        errorDetail = await response.text();
      } catch {}

      if (response.status === 404) {
        throw new Error(`Registry Endpoint Not Found (404): ${url}\nPlease verify API mapping.`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("Registry session expired or access restricted.");
      }
      if (response.status === 500) {
        throw new Error(`Registry Server Error (500): ${errorDetail || "Unknown Cause"}`);
      }
      throw new Error(errorDetail || `Registry transmission failed: HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  } catch (e: any) {
    if (e?.message === "Failed to fetch") {
      throw new Error("Network Fault: Unable to reach registry gateway. Check connection proxy.");
    }
    throw e;
  }
}