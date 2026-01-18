export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // /api/xxx -> /xxx
  let path = url.pathname.replace(/^\/api/, "");
  if (!path.startsWith("/")) path = "/" + path;

  const BACKEND_WORKER = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

  // ✅ 只有这三个是 public，而且在 worker 里是 /public/*
  const PUBLIC_ROOTS = ["/site-config", "/products", "/inquiries"];
  const isPublic = PUBLIC_ROOTS.some(p => path === p || path.startsWith(p + "/"));

  // ✅ 其余都走 root（包括 admin/factory/login/upload-image）
  const targetUrl = isPublic
    ? `${BACKEND_WORKER}/public${path}${url.search}`
    : `${BACKEND_WORKER}${path}${url.search}`;

  // ✅ 只转发必要 header（FormData 不要手动设置 content-type）
  const headers = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);

  // content-type：只有非 FormData/非文件上传才转发，避免 boundary 被破坏
  const ct = request.headers.get("content-type") || "";
  const isMultipart = ct.includes("multipart/form-data");
  if (ct && !isMultipart) headers.set("content-type", ct);

  try {
    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      // ✅ 直接透传 body（FormData 也能正常传）
      init.body = request.body;
    }

    const backendResponse = await fetch(targetUrl, init);

    // ✅ 返回时不要带跨域头，保持 same-origin
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
