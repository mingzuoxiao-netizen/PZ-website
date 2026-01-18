export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // Extract path and ensure it starts with /
  // e.g. /api/products -> /products
  const path = url.pathname.replace(/^\/api/, "");
  
  const BACKEND_WORKER = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";
  
  /**
   * Routing Logic:
   * Public endpoints like /site-config, /products, /inquiries live under /public/... in the worker.
   * Admin and Auth endpoints like /admin/*, /factory/*, /login are root-level in the worker.
   */
  const isProtected = path.startsWith('/admin') || path.startsWith('/factory') || path.startsWith('/login');
  const targetUrl = isProtected 
    ? `${BACKEND_WORKER}${path}${url.search}` 
    : `${BACKEND_WORKER}/public${path}${url.search}`;

  // Filter headers: Only forward essential ones to prevent leaking client/pages-specific headers
  // This satisfies the safety requirement to exclude cookie, origin, referer, etc.
  const allowedHeaders = ['content-type', 'authorization', 'accept'];
  const headers = new Headers();
  allowedHeaders.forEach(h => {
    const val = request.headers.get(h);
    if (val) headers.set(h, val);
  });

  try {
    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.clone().arrayBuffer() 
        : undefined,
      redirect: 'manual'
    });

    const resHeaders = new Headers(backendResponse.headers);
    
    // Step 5: Remove all CORS related response headers as we are now same-domain
    resHeaders.delete("Access-Control-Allow-Origin");
    resHeaders.delete("Access-Control-Allow-Methods");
    resHeaders.delete("Access-Control-Allow-Headers");
    resHeaders.delete("Access-Control-Max-Age");

    // Ensure no stale caching
    resHeaders.set("Cache-Control", "no-store");

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: resHeaders
    });
    
  } catch (err: any) {
    return new Response(JSON.stringify({ 
      error: "Gateway error", 
      details: err.message 
    }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }
}