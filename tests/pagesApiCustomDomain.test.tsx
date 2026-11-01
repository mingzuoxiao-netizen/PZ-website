import test from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/api/[[path]]";

const legacy = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";
const custom = "https://api.peng-zhan.com";
const staging = "https://pz-inquiry-api-staging.mingzuoxiao29.workers.dev";
const production = "www.peng-zhan.com";
const preview = "pr16.pz-website-lw7.pages.dev";

async function invoke(
  hostname: string,
  route: string,
  configuredBackend?: string,
  options?: { method?: string; authorization?: string; body?: string }
) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({ reached: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  };
  try {
    const headers: Record<string, string> = {};
    if (options?.authorization) headers.Authorization = options.authorization;
    if (options?.body !== undefined) headers["Content-Type"] = "application/json";
    const request = new Request(`https://${hostname}${route}`, {
      method: options?.method ?? "GET",
      headers,
      body: options?.body,
    });
    const response = await onRequest({
      request,
      env: configuredBackend === undefined ? {} : { PZ_BACKEND_WORKER: configuredBackend },
    });
    return { response, calls };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("production defaults to original workers.dev until explicitly opted in", async () => {
  const withoutVariable = await invoke(production, "/api/site-config");
  assert.equal(withoutVariable.response.status, 200);
  assert.equal(withoutVariable.calls[0]?.url, `${legacy}/api/site-config`);
  const explicitLegacy = await invoke(production, "/api/admin/products", legacy);
  assert.equal(explicitLegacy.calls[0]?.url, `${legacy}/admin/products`);
});

test("production custom-domain cutover forwards public and protected API routes", async () => {
  const catalog = await invoke(production, "/api/products?v=2", custom);
  assert.equal(catalog.response.status, 200);
  assert.equal(catalog.calls[0]?.url, `${custom}/public/products?v=2`);
  const siteConfig = await invoke(production, "/api/site-config", custom);
  assert.equal(siteConfig.calls[0]?.url, `${custom}/api/site-config`);
  const admin = await invoke(production, "/api/admin/products", custom, {
    authorization: "Bearer test-token",
  });
  assert.equal(admin.calls[0]?.url, `${custom}/admin/products`);
  assert.equal(
    (admin.calls[0]?.init.headers as Headers).get("authorization"),
    "Bearer test-token"
  );
  const login = await invoke(production, "/api/login", custom, {
    method: "POST",
    body: JSON.stringify({ username: "synthetic", password: "not-real" }),
  });
  assert.equal(login.calls[0]?.url, `${custom}/login`);
  assert.equal(login.calls[0]?.init.method, "POST");
  assert.equal(login.response.headers.get("Cache-Control"), "no-store");
});

test("legacy production Pages domain also accepts deliberate cutover", async () => {
  const result = await invoke("pz-website-lw7.pages.dev", "/api/site-config", custom);
  assert.equal(result.calls[0]?.url, `${custom}/api/site-config`);
});

test("production fails closed on unexpected backend value", async () => {
  for (const value of ["https://attacker.example", staging, "http://api.peng-zhan.com"]) {
    const result = await invoke(production, "/api/admin/products", value);
    assert.equal(result.response.status, 503);
    assert.equal(result.calls.length, 0);
  }
});

test("preview can only use Staging even after production cutover is configured", async () => {
  const correct = await invoke(preview, "/api/site-config", staging);
  assert.equal(correct.response.status, 200);
  assert.equal(correct.calls[0]?.url, `${staging}/api/site-config`);

  for (const invalid of [undefined, legacy, custom]) {
    const denied = await invoke(preview, "/api/admin/products", invalid);
    assert.equal(denied.response.status, 503);
    assert.equal(denied.calls.length, 0);
  }
});

test("inquiries cannot be listed publicly via the Pages API gateway", async () => {
  const result = await invoke(production, "/api/inquiries", custom);
  assert.equal(result.response.status, 405);
  assert.equal(result.calls.length, 0);
});

test("public products reject writes without forwarding to production", async () => {
  const result = await invoke(production, "/api/products", custom, {
    method: "POST",
    body: JSON.stringify({ name: "not-saved" }),
  });
  assert.equal(result.response.status, 405);
  assert.equal(result.calls.length, 0);
});
