export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // Extract path following /api (e.g. /api/products -> /products)
  let path = url.pathname.replace(/^\/api/, "");
  if (!path.startsWith("/")) path = "/" + path;

  const BACKEND_WORKER = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";
  const method = request.method.toUpperCase();

  /**
   * BACKEND ROUTING RULES:
   * 1) Public GET endpoints (products, site-config) are mapped to /public/* on the worker.
   * 2) Public POST endpoints (inquiries) are usually at root or handled differently.
   * 3) Admin/Factory/Upload operations are always at root.
   */

  const PUBLIC_GET_PATHS = ["/site-config", "/products"];
  const isPublicGet = method === "GET" && PUBLIC_GET_PATHS.some(p => path === p || path.startsWith(p + "/"));
  
  let targetUrl: string;
  if (isPublicGet) {
    // Redirect to public read namespace
    targetUrl = `${BACKEND_WORKER}/public${path}${url.search}`;
  } else {
    // Forward directly to root (Admin, Factory, POST inquiries, Uploads)
    targetUrl = `${BACKEND_WORKER}${path}${url.search}`;
  }

  console.log(`[Proxy] ${method} ${url.pathname} -> ${targetUrl}`);

  const headers = new Headers();
  const allowHeaders = ["content-type", "authorization", "accept"];
  for (const h of allowHeaders) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }

  try {
    const init: RequestInit = {
      method,
      headers,
      redirect: "manual",
    };

    // Forward body for mutations
    if (method !== "GET" && method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }

    const backendResponse = await fetch(targetUrl, init);

    const resHeaders = new Headers(backendResponse.headers);
    // Sanitize CORS for same-origin execution
    resHeaders.delete("Access-Control-Allow-Origin");
    resHeaders.delete("Access-Control-Allow-Methods");
    resHeaders.delete("Access-Control-Allow-Headers");
    resHeaders.set("Cache-Control", "no-store");

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error(`[Proxy Error] ${url.pathname}:`, err);
    return new Response(
      JSON.stringify({ 
        error: "Gateway Communication Error", 
        details: err?.message ?? "Check network connection to backend worker." 
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}