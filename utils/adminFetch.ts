export const ADMIN_API_BASE =
  "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

export const ADMIN_SESSION_KEY = "pz_admin_token";

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

  // ✅ 只在非 FormData 时设置 Content-Type
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // ✅ 标准 Bearer 鉴权（唯一需要的）
  if (!skipAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

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
    console.warn("[adminFetch] Unauthorized");
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
