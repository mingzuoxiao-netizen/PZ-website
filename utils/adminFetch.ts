// utils/adminFetch.ts

export const ADMIN_API_BASE = "/api";
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

  // 确保 endpoint 不以斜杠开头，防止拼接出 //api//path
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  
  let url = endpoint.startsWith("http")
    ? endpoint
    : `${ADMIN_API_BASE}/${cleanEndpoint}`;

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

    // 处理成功但无内容的情况
    if (response.status === 204) return {} as T;

    if (!response.ok) {
      let errorDetail = "";
      try {
          errorDetail = await response.text();
      } catch (e) {}

      // 这里的错误信息会被页面组件的 catch 捕获并 alert
      if (response.status === 404) {
        throw new Error(`接口不存在 (404): ${url}\n请检查后端路由配置。`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("登录已过期或无权访问此接口。");
      }
      if (response.status === 500) {
        throw new Error(`服务器内部错误 (500): ${errorDetail || '未知原因'}`);
      }
      throw new Error(errorDetail || `请求失败: HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  } catch (e: any) {
      if (e.message === 'Failed to fetch') {
          throw new Error("网络连接失败: 无法连接到 API 代理。请检查代理配置。");
      }
      throw e;
  }
}