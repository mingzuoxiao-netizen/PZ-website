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
      cache: "no-store", 
    });

    if (response.status === 204) return {} as T;

    if (!response.ok) {
      let errorDetail = "";
      try {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
           const json = await response.json();
           errorDetail = json.message || json.error || "";
        } else {
           errorDetail = await response.text();
        }
      } catch {}

      // Handle HTML error pages from Workers/Proxy
      if (errorDetail.includes("<!DOCTYPE html>")) {
         errorDetail = "Registry Gateway Fault. Check Serverless Worker configuration.";
      }

      if (response.status === 404) {
        throw new Error(`Archive endpoint not found (404): ${url}`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("Session expired or unauthorized. Re-authentication required.");
      }
      if (response.status === 500) {
        throw new Error(`Internal Server Fault (500): ${errorDetail || "Unknown Cause"}`);
      }
      throw new Error(errorDetail || `Protocol Error: HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  } catch (e: any) {
    if (e?.message === "Failed to fetch") {
      throw new Error("Network Path Fault: Unable to reach registry gateway.");
    }
    throw e;
  }
}
