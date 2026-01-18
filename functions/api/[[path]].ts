export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // Step 1: Strip /api/ and ensure the remaining path starts with /
  // e.g. /api/site-config -> /site-config
  const path = url.pathname.replace(/^\/api\//, "/");
  
  // Real backend worker URL
  const BACKEND_WORKER = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";
  const targetUrl = `${BACKEND_WORKER}/public${path}${url.search}`;

  // Clone headers for the outgoing request
  const headers = new Headers(request.headers);
  
  try {
    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      // Handle bodies for POST/PUT requests
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.clone().arrayBuffer() 
        : undefined,
      redirect: 'follow'
    });

    // Step 2: Sanitize response headers
    // Don't forward "raw" headers to avoid CORS/Cache conflicts
    const resHeaders = new Headers(backendResponse.headers);
    
    // Ensure the browser accepts the response and doesn't cache it improperly
    resHeaders.set("Access-Control-Allow-Origin", "*"); 
    resHeaders.set("Cache-Control", "no-store");

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: resHeaders
    });
    
  } catch (err: any) {
    return new Response(JSON.stringify({ 
      error: "Proxy failed to reach backend", 
      details: err.message 
    }), {
      status: 502,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}