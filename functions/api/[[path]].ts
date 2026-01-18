export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // 获取 /api 之后的路径
  let path = url.pathname.replace(/^\/api/, "");
  if (!path.startsWith("/")) path = "/" + path;

  const BACKEND_WORKER = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

  /**
   * 后端路由规范：
   * 1) 所有的公共 GET 接口（products, site-config）在后端 worker 挂载在 /public/*
   * 2) 所有的管理接口（admin/*, factory/*）以及登录（login）在根路径
   */

  const PUBLIC_PATHS = ["/site-config", "/products", "/inquiries"];

  // 判定是否是公共路径
  const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + "/"));
  
  // 判定是否是登录或管理路径
  const isAuthOrAdmin = 
    path.startsWith("/admin") || 
    path.startsWith("/factory") || 
    path.startsWith("/login") || 
    path === "/upload-image";

  let targetUrl: string;

  if (isPublic) {
    // 公共接口转发到后端的 /public 目录下
    targetUrl = `${BACKEND_WORKER}/public${path}${url.search}`;
  } else {
    // 其他接口（包含 admin, factory, login）直接打到根
    targetUrl = `${BACKEND_WORKER}${path}${url.search}`;
  }

  console.log(`[Proxy] Forwarding ${url.pathname} -> ${targetUrl}`);

  const headers = new Headers();
  const allow = ["content-type", "authorization", "accept"];
  for (const h of allow) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }

  try {
    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }

    const backendResponse = await fetch(targetUrl, init);

    const resHeaders = new Headers(backendResponse.headers);
    resHeaders.delete("Access-Control-Allow-Origin");
    resHeaders.delete("Access-Control-Allow-Methods");
    resHeaders.delete("Access-Control-Allow-Headers");
    resHeaders.set("Cache-Control", "no-store");

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Gateway error", details: err?.message ?? String(err) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}