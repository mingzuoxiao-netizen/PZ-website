export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // /api/products -> /products
  let path = url.pathname.replace(/^\/api/, "");
  if (!path.startsWith("/")) path = "/" + path;

  const BACKEND_WORKER = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

  /**
   * Backend routing truth:
   * - Public READ endpoints live under /public/* (GET only)
   *   GET  /public/site-config
   *   GET  /public/products
   *   POST /public/inquiries   (lead submit; if your backend expects POST here, keep it public)
   *
   * - All admin/auth/write endpoints are root-level (no /public prefix)
   *   POST /site-config        (publish/update site config)
   *   POST /upload-image       (ADMIN/FACTORY upload)
   *   POST /admin/delete-image (ADMIN delete)
   *   /admin/* /factory/* /login* etc.
   */

  // Public endpoints (path-level)
  const PUBLIC_PATHS = new Set<string>([
    "/site-config",
    "/products",
    "/inquiries",
  ]);

  // Root-only endpoints (must NEVER be routed under /public)
  const ROOT_ONLY_PATHS = new Set<string>([
    "/upload-image",
    "/admin/delete-image",
  ]);

  const method = request.method.toUpperCase();

  // Decide if this request should go to /public
  // ✅ Strict rule: ONLY GET for public paths goes to /public
  const isPublicRead = method === "GET" && PUBLIC_PATHS.has(path);

  // Root-level always:
  // - any non-GET (publish/update/delete/upload)
  // - admin/factory/login namespaces
  // - explicit root-only endpoints
  const isRoot =
    method !== "GET" ||
    path.startsWith("/admin") ||
    path.startsWith("/factory") ||
    path.startsWith("/login") ||
    ROOT_ONLY_PATHS.has(path);

  let targetUrl: string;

  if (isPublicRead && !isRoot) {
    targetUrl = `${BACKEND_WORKER}/public${path}${url.search}`;
  } else {
    targetUrl = `${BACKEND_WORKER}${path}${url.search}`;
  }

  console.log(`[Proxy] ${method} ${url.pathname} -> ${targetUrl}`);

  // Forward only essential headers
  const headers = new Headers();
  const allow = ["content-type", "authorization", "accept"];
  for (const h of allow) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }

  try {
    const init: RequestInit = {
      method,
      headers,
      redirect: "manual",
    };

    // Preserve request body for non-GET/HEAD (supports JSON and multipart/form-data uploads)
    if (method !== "GET" && method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }

    const backendResponse = await fetch(targetUrl, init);

    // Copy response headers and remove CORS headers (same-origin now)
    const resHeaders = new Headers(backendResponse.headers);
    resHeaders.delete("Access-Control-Allow-Origin");
    resHeaders.delete("Access-Control-Allow-Methods");
    resHeaders.delete("Access-Control-Allow-Headers");
    resHeaders.delete("Access-Control-Max-Age");

    // Avoid stale caches during admin operations
    resHeaders.set("Cache-Control", "no-store");

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Gateway error", details: err?.message ?? String(err) }),
      {
        status: 502,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
  }
}
