export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // /api/products -> /products
  const path = url.pathname.replace(/^\/api/, "");

  const BACKEND_WORKER = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

  /**
   * Routing rules (authoritative):
   * 1) Public GET/POST endpoints are under /public/*
   *    - /site-config  -> /public/site-config
   *    - /products     -> /public/products
   *    - /inquiries    -> /public/inquiries
   *
   * 2) Protected/root endpoints are NOT under /public
   *    - /upload-image         (ADMIN/FACTORY)  -> /upload-image
   *    - /admin/delete-image   (ADMIN)          -> /admin/delete-image
   *    - /admin/* /factory/* /login* -> root-level (as-is)
   */

  const PUBLIC_PATHS = new Set<string>([
    "/site-config",
    "/products",
    "/inquiries",
  ]);

  // These must NEVER be routed under /public
  const ROOT_ONLY_PATHS = new Set<string>([
    "/upload-image",
    "/admin/delete-image",
  ]);

  const isAdminFactoryLogin =
    path.startsWith("/admin") ||
    path.startsWith("/factory") ||
    path.startsWith("/login");

  // Decide target URL
  let targetUrl: string;

  if (ROOT_ONLY_PATHS.has(path) || isAdminFactoryLogin) {
    // Root-level on worker
    targetUrl = `${BACKEND_WORKER}${path}${url.search}`;
  } else if (PUBLIC_PATHS.has(path)) {
    // Public endpoints live under /public
    targetUrl = `${BACKEND_WORKER}/public${path}${url.search}`;
  } else {
    // Safe default: do NOT accidentally expose new endpoints under /public
    // You can change this to proxy root-level if you want, but this is safer.
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  // Forward only essential headers (avoid cookie/origin/referer/sec-*/cf-* etc.)
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

    // Preserve body for POST/PUT/PATCH/DELETE etc.
    if (request.method !== "GET" && request.method !== "HEAD") {
      // Use arrayBuffer to support multipart/form-data uploads
      init.body = await request.arrayBuffer();
    }

    const backendResponse = await fetch(targetUrl, init);

    // Copy response headers but remove cross-domain CORS headers (same-origin now)
    const resHeaders = new Headers(backendResponse.headers);
    resHeaders.delete("Access-Control-Allow-Origin");
    resHeaders.delete("Access-Control-Allow-Methods");
    resHeaders.delete("Access-Control-Allow-Headers");
    resHeaders.delete("Access-Control-Max-Age");

    // Prevent unexpected caching during admin work
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
