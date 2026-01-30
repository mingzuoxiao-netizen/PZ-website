export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // /api/xxx -> /xxx
  let path = url.pathname.replace(/^\/api/, "");
  if (!path.startsWith("/")) path = "/" + path;

  const BACKEND_WORKER = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

  // Removed /site-config from public roots
  const PUBLIC_ROOTS = ["/products", "/inquiries"];
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const isPublicPath = PUBLIC_ROOTS.some(
    (p) => path === p || path.startsWith(p + "/")
  );

  // 只允许 GET/HEAD 走 public
  const isReadMethod = request.method === "GET" || request.method === "HEAD";
  const isPublicRead = isPublicPath && isReadMethod;

  // ✅ 封死：public path 上的写请求一律 405（避免误转发造成 404/脏写）
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

  // ✅ upload-image / admin / factory / login 都在根路径（不加 /public）
  const targetUrl = isPublicRead
    ? `${BACKEND_WORKER}/public${path}${url.search}`
    : `${BACKEND_WORKER}${path}${url.search}`;

  // ✅ 只转发必要 header；multipart 时必须带上 content-type（含 boundary）
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

    // ✅ 不是 GET/HEAD 才转发 body（FormData 上传必备）
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const backendResponse = await fetch(targetUrl, init);

    const resHeaders = new Headers(backendResponse.headers);
    // same-origin 不需要 CORS 头
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