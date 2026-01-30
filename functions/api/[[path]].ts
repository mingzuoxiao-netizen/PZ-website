export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // /api/xxx -> /xxx
  let path = url.pathname.replace(/^\/api/, "");
  if (!path.startsWith("/")) path = "/" + path;

  const BACKEND_WORKER = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

  // Removed /site-config and /upload-image from public roots to enforce Auth branch
  const PUBLIC_ROOTS = ["/products", "/inquiries"];
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
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
  const targetUrl = isPublicRead
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