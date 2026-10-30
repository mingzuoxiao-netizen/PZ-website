export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // /api/xxx -> /xxx
  let path = url.pathname.replace(/^\/api/, "");
  if (!path.startsWith("/")) path = "/" + path;

  // Production defaults to the existing API. Configure PZ_BACKEND_WORKER
  // in *Preview only* to point to an isolated staging Worker + D1.
  const configuredBackend = String(context.env?.PZ_BACKEND_WORKER || "").trim().replace(/\/$/, "");
  const isPreviewHost = url.hostname.endsWith(".pz-website-lw7.pages.dev");

  // Fail closed on Cloudflare Pages previews. A missing/invalid preview binding must
  // NEVER silently route admin or factory writes to the production Worker/D1.
  const expectedStagingBackend = "https://pz-inquiry-api-staging.mingzuoxiao29.workers.dev";
  if (isPreviewHost && configuredBackend !== expectedStagingBackend) {
    return new Response(JSON.stringify({
      error: "Preview backend not configured",
      details: "Set PZ_BACKEND_WORKER to the dedicated Staging Worker in Pages Preview variables, then redeploy this Preview."
    }), {
      status: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const BACKEND_WORKER = isPreviewHost
    ? expectedStagingBackend
    : /^https:\/\/[a-z0-9.-]+\.workers\.dev\/?$/i.test(configuredBackend)
      ? configuredBackend
      : "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

  // Removed /site-config and /upload-image from public roots to enforce Auth branch
  const PUBLIC_ROOTS = ["/products"];
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  // Inquiries are public submissions, never a public listing.
  // Administrative reads use /admin/inquiries and backend authorization.
  if ((path === "/inquiries" || path.startsWith("/inquiries/")) &&
      !(path === "/inquiries" && request.method === "POST")) {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Allow": "POST" },
    });
  }

  const isPublicPath = PUBLIC_ROOTS.some(
    (p) => path === p || path.startsWith(p + "/")
  );

  // Only allow GET/HEAD for public paths
  const isReadMethod = request.method === "GET" || request.method === "HEAD";
  const isPublicRead = isPublicPath && isReadMethod;

  // Enforce read-only for public paths (block POST/PUT/PATCH/DELETE)
  const isWriteMethod =
    request.method === "POST" ||
    request.method === "PUT" ||
    request.method === "PATCH" ||
    request.method === "DELETE";

  if (isPublicPath && isWriteMethod) {
    return new Response(
      JSON.stringify({
        error: "Method Not Allowed",
        details: `Public endpoint is read-only: ${request.method} ${path}`,
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // Target routing: publicRead branch prepends /public, others go direct to protected backend
  const targetUrl = path === "/site-config" && request.method === "GET"
    ? `${BACKEND_WORKER}/api/site-config${url.search}`
    : isPublicRead
    ? `${BACKEND_WORKER}/public${path}${url.search}`
    : `${BACKEND_WORKER}${path}${url.search}`;

  const headers = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const ct = request.headers.get("content-type");
  if (ct) headers.set("content-type", ct);

  try {
    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const backendResponse = await fetch(targetUrl, init);

    const resHeaders = new Headers(backendResponse.headers);
    resHeaders.delete("Access-Control-Allow-Origin");
    resHeaders.delete("Access-Control-Allow-Methods");
    resHeaders.delete("Access-Control-Allow-Headers");
    resHeaders.delete("Access-Control-Max-Age");
    // Catalog V2 responses may use short public CDN TTLs. All authenticated
    // and legacy routes remain uncached. The Worker is authoritative for V2.
    if (isPublicRead && request.method === "GET" && url.searchParams.get("v") === "2") {
      resHeaders.set("Cache-Control", backendResponse.headers.get("Cache-Control") || "public, max-age=0, s-maxage=15");
    } else {
      resHeaders.set("Cache-Control", "no-store");
    }

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
