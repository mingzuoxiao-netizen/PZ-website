
export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // /api/xxx -> /xxx
  let path = url.pathname.replace(/^\/api/, "");
  if (!path.startsWith("/")) path = "/" + path;

  // ============================================================
  // PZ API GATEWAY - ENVIRONMENT ISOLATION
  // Production uses the production Worker.
  // Preview must explicitly use the dedicated Staging Worker.
  // Missing or invalid configuration fails closed.
  // ============================================================

  // Production stays on the proven legacy origin until Pages Production
  // PZ_BACKEND_WORKER is explicitly switched to the custom domain.
  // This allows a reversible cutover without changing Staging behaviour.
  const LEGACY_PRODUCTION_WORKER =
    "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

  const CUSTOM_DOMAIN_PRODUCTION_WORKER =
    "https://api.peng-zhan.com";

  const STAGING_WORKER =
    "https://pz-inquiry-api-staging.mingzuoxiao29.workers.dev";

  const hostname = url.hostname.toLowerCase();

  // Only these canonical hostnames are treated as Production.
  // All other hostnames must have the Staging backend configured.
  const PRODUCTION_HOSTS = new Set([
    "www.peng-zhan.com",
    "peng-zhan.com",
    "pz-website-lw7.pages.dev",
  ]);

  const isProductionHost = PRODUCTION_HOSTS.has(hostname);

  // Normalize optional trailing slashes.
  const configuredBackend = String(
    context.env?.PZ_BACKEND_WORKER || ""
  )
    .trim()
    .replace(/\/+$/, "");

  const jsonError = (
    status: number,
    error: string,
    details: string
  ) =>
    new Response(
      JSON.stringify({ error, details }),
      {
        status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );

  // Production accepts only the original Worker or its verified Custom Domain.
  // Never accept arbitrary origins in an authenticated API gateway.
  // An omitted value retains the original backend until the operator opts in.
  if (isProductionHost) {
    if (
      configuredBackend &&
      configuredBackend !== LEGACY_PRODUCTION_WORKER &&
      configuredBackend !== CUSTOM_DOMAIN_PRODUCTION_WORKER
    ) {
      return jsonError(
        503,
        "Production backend misconfigured",
        "The Production environment must use the Production Worker."
      );
    }
  } else {
    // Fail closed on Preview and unknown hostnames.
    // Never silently fall back to the Production Worker.
    if (configuredBackend !== STAGING_WORKER) {
      return jsonError(
        503,
        "Preview backend not configured",
        "Set PZ_BACKEND_WORKER to the dedicated Staging Worker in Cloudflare Pages Preview settings."
      );
    }
  }

  const BACKEND_WORKER = isProductionHost
    ? (configuredBackend || LEGACY_PRODUCTION_WORKER)
    : STAGING_WORKER;

  // ============================================================
  // PUBLIC API ACCESS CONTROL
  // ============================================================

  // Removed /site-config and /upload-image from public roots
  // to enforce the protected authorization branch.
  const PUBLIC_ROOTS = ["/products"];

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
    });
  }

  // Inquiries are public submissions, never a public listing.
  // Administrative reads use /admin/inquiries and backend auth.
  if (
    (path === "/inquiries" ||
      path.startsWith("/inquiries/")) &&
    !(
      path === "/inquiries" &&
      request.method === "POST"
    )
  ) {
    return new Response(
      JSON.stringify({
        error: "Method Not Allowed",
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Allow": "POST",
        },
      }
    );
  }

  const isPublicPath = PUBLIC_ROOTS.some(
    (p) => path === p || path.startsWith(p + "/")
  );

  // Only GET and HEAD are public read methods.
  const isReadMethod =
    request.method === "GET" ||
    request.method === "HEAD";

  const isPublicRead =
    isPublicPath && isReadMethod;

  // Block writes to public product endpoints.
  const isWriteMethod =
    request.method === "POST" ||
    request.method === "PUT" ||
    request.method === "PATCH" ||
    request.method === "DELETE";

  if (isPublicPath && isWriteMethod) {
    return new Response(
      JSON.stringify({
        error: "Method Not Allowed",
        details:
          `Public endpoint is read-only: ${request.method} ${path}`,
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

  // ============================================================
  // BACKEND ROUTING
  // ============================================================

  // Public product reads -> /public/products
  // Site config reads    -> /api/site-config
  // Other routes         -> backend's protected routes

  const targetUrl =
    path === "/site-config" &&
    request.method === "GET"
      ? `${BACKEND_WORKER}/api/site-config${url.search}`
      : isPublicRead
        ? `${BACKEND_WORKER}/public${path}${url.search}`
        : `${BACKEND_WORKER}${path}${url.search}`;

  // Forward only required request headers.
  const headers = new Headers();

  const auth = request.headers.get("authorization");
  if (auth) {
    headers.set("authorization", auth);
  }

  const accept = request.headers.get("accept");
  if (accept) {
    headers.set("accept", accept);
  }

  const ct = request.headers.get("content-type");
  if (ct) {
    headers.set("content-type", ct);
  }

  // ============================================================
  // FORWARD REQUEST
  // ============================================================

  try {
    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (
      request.method !== "GET" &&
      request.method !== "HEAD"
    ) {
      init.body = request.body;
    }

    const backendResponse = await fetch(
      targetUrl,
      init
    );

    const resHeaders = new Headers(
      backendResponse.headers
    );

    // The Pages gateway owns the browser-facing response.
    // Do not forward upstream CORS headers.
    resHeaders.delete(
      "Access-Control-Allow-Origin"
    );
    resHeaders.delete(
      "Access-Control-Allow-Methods"
    );
    resHeaders.delete(
      "Access-Control-Allow-Headers"
    );
    resHeaders.delete(
      "Access-Control-Max-Age"
    );

    // ==========================================================
    // CACHE POLICY
    // ==========================================================

    // Catalog V2 can use short public CDN caching.
    // Authenticated and legacy routes are always uncached.
    if (
      isPublicRead &&
      request.method === "GET" &&
      url.searchParams.get("v") === "2"
    ) {
      resHeaders.set(
        "Cache-Control",
        backendResponse.headers.get(
          "Cache-Control"
        ) ||
          "public, max-age=0, s-maxage=15"
      );
    } else {
      resHeaders.set(
        "Cache-Control",
        "no-store"
      );
    }

    return new Response(
      backendResponse.body,
      {
        status: backendResponse.status,
        headers: resHeaders,
      }
    );
  } catch (err: any) {
    return jsonError(
      502,
      "Gateway error",
      err?.message ?? String(err)
    );
  }
}

