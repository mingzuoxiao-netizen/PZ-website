export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // /api/site-config -> /site-config
  const path = url.pathname.replace(/^\/api/, "");

  const BACKEND_WORKER = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";
  const targetUrl = `${BACKEND_WORKER}/public${path}${url.search}`;

  // 只转发必要 header（避免奇怪的缓存/CORS问题）
  const headers = new Headers();
  const ct = request.headers.get("content-type");
  if (ct) headers.set("content-type", ct);

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const backendResponse = await fetch(targetUrl, init);

  // 返回后端内容（同域，其实不需要 CORS，但加 no-store 防缓存）
  const resHeaders = new Headers(backendResponse.headers);
  resHeaders.set("Cache-Control", "no-store");

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: resHeaders,
  });
}
