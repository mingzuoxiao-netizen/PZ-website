
import { API_BASE } from './siteConfig';
import { ADMIN_SESSION_KEY } from './adminFetch';

export const FACTORY_API_BASE = API_BASE;

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

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

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  let url = endpoint.startsWith("http")
    ? endpoint
    : `${FACTORY_API_BASE}/${cleanEndpoint}`;

  if (params) {
    const search = new URLSearchParams(params).toString();
    url += `${url.includes("?") ? "&" : "?"}${search}`;
  }

  try {
    const response = await fetch(url, {
      method: customConfig.method || "GET",
      ...customConfig,
      headers,
    });

    if (!response.ok) {
      let errorDetail = "";
      try { errorDetail = await response.text(); } catch (e) {}

      if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized: Your session may have expired.");
      }
      if (response.status === 500) {
        throw new Error(`Server Error (500). Details: ${errorDetail}`);
      }
      throw new Error(errorDetail || `HTTP ${response.status}`);
    }

    if (response.status === 204) return {} as T;

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await response.json();
    }
    return (await response.text()) as unknown as T;
  } catch (e: any) {
    if (e.message === 'Failed to fetch') {
        throw new Error("Network Error: Could not connect to API. Please check your internet or contact technical support.");
    }
    throw e;
  }
}
