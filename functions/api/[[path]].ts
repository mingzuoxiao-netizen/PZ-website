export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // /api/products -> /products
  const path = url.pathname.replace(/^\/api/, "");

  const BACKEND_WORKER = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

  /**
   * Routing rules:
   * 1) Public GET/POST endpoints are under /public/* on the worker
   * 2) Private/Admin endpoints are at root
   */

  const PUBLIC_PATHS = new Set<string>([
    "/site-config",
    "/products",
    "/inquiries",
  ]);

  const ROOT_ONLY_PATHS = new Set<string>([
    "/upload-image",
    "/admin/delete-image",
  ]);

  const isAdminFactoryLogin =
    path.startsWith("/admin") ||
    path.startsWith("/factory") ||
    path.startsWith("/login");

  let targetUrl: string;

  if (ROOT_ONLY_PATHS.has(path) || isAdminFactoryLogin) {
    targetUrl = `${BACKEND_WORKER}${path}${url.search}`;
  } else if (PUBLIC_PATHS.has(path)) {
    // PUBLIC paths hit the /public prefix on the backend
    targetUrl = `${BACKEND_WORKER}/public${path}${url.search}`;
  } else {
    // Default fallback to root for any other valid requests
    targetUrl = `${BACKEND_WORKER}${path}${url.search}`;
  }

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
    resHeaders.delete("Access-Control-Max-Age");
    resHeaders.set("Cache-Control", "no-store");

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Gateway error", details: err?.message ?? String(err) }),
      { status: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  }
}