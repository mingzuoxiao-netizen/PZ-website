// utils/adminFetch.ts

export const ADMIN_API_BASE = "/api";
export const ADMIN_SESSION_KEY = "pz_auth_token";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
}

function normalizeEndpoint(endpoint: string) {
  // Allow callers to pass "/api/xxx" or "api/xxx" by mistake
  let ep = endpoint.trim();

  // If it's a full URL, keep it
  if (ep.startsWith("http://") || ep.startsWith("https://")) return ep;

  // Ensure it starts with "/"
  if (!ep.startsWith("/")) ep = `/${ep}`;

  // If someone passed "/api/xxx", strip the "/api" prefix because we will add ADMIN_API_BASE anyway
  if (ep.startsWith("/api/")) ep = ep.replace(/^\/api/, "");

  return ep; // always like "/site-config"
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

  // Build headers safely
  const headers = new Headers(customConfig.headers || {});
  const isFormData = customConfig.body instanceof FormData;

  // Important: NEVER set Content-Type manually for FormData (browser sets boundary)
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
        throw new Error(`接口不存在 (404): ${url}\n请检查 API 路由/代理映射。`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("登录已过期或无权访问此接口。");
      }
      if (response.status === 500) {
        throw new Error(`服务器内部错误 (500): ${errorDetail || "未知原因"}`);
      }
      throw new Error(errorDetail || `请求失败: HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  } catch (e: any) {
    if (e?.message === "Failed to fetch") {
      throw new Error("网络连接失败: 无法连接到 API 代理。请检查代理配置。");
    }
    throw e;
  }
}
