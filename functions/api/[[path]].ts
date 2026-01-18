export async function onRequest() {
  return new Response(JSON.stringify({ ok: true, hit: "pages-functions" }), {
    headers: { "Content-Type": "application/json" },
  });
}
