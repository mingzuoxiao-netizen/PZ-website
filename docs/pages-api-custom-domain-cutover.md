# PZ Pages Production API custom-domain cutover

## Scope

A dedicated draft PR changes only `functions/api/[[path]].ts` to recognize the
Cloudflare Worker Custom Domain `https://api.peng-zhan.com` as a **strictly
allowlisted** Production backend. It preserves the original
`https://pz-inquiry-api.mingzuoxiao29.workers.dev` as the **default** and
preserves the dedicated Staging backend for all Pages Preview hosts.

**Merging this PR alone does not switch live API traffic.** Production only
switches when its Pages runtime variable `PZ_BACKEND_WORKER` is explicitly set
to `https://api.peng-zhan.com` and the relevant Pages deployment becomes active.

## Before changing Production

1. Keep the direct Production `workers.dev` route ON for rollback. Do not
   change or rebind D1, KV, R2, or JWT secrets.
2. Confirm the Worker Custom Domain shows
   `api.peng-zhan.com -> pz-inquiry-api`, with a valid HTTPS certificate.
3. Confirm both Cloudflare WAF login paths are covered by the existing
   rate-limiting rule: `/api/login` (site) and `/login` (direct Worker).
   Configure by zone and review rate-limit false positives.
4. Verify **direct, unauthenticated GETs** without posting credentials:
   `https://api.peng-zhan.com/admin/products` -> 401,
   `https://api.peng-zhan.com/public/products?v=2` -> expected public items,
   `https://api.peng-zhan.com/api/site-config` -> expected published configuration.
   If any direct endpoint behaves unexpectedly, do not cut over.
5. In Cloudflare Pages project `pz-website-lw7`, read the current runtime
   `PZ_BACKEND_WORKER` settings for **Production** and **Preview**.
   Keep Preview = `https://pz-inquiry-api-staging.mingzuoxiao29.workers.dev`.
   Check that no Production variable is unintentionally set to Staging.
6. Ensure the PR CI passed (TypeScript, all unit tests, Vite and Pages Functions build).
   Preview smoke-test `/api/site-config` and authenticated Staging login.
   Preview MUST remain Staging, even though the PR code also knows the Production domain.

## Safe change / rollback

1. After reviewer approval, merge this **gateway-only** PR. Verify the
   Cloudflare Pages **Production deployment succeeds** and the live site
   continues to work on the **legacy backend**; confirm the effective
   Pages Production variable before interpreting results.
2. Change **Pages Production** runtime variable `PZ_BACKEND_WORKER` to
   `https://api.peng-zhan.com` (no trailing slash) and save. Redeploy
   Production if required for the change to reach Pages Functions.
   **Never put this value into Preview.**
3. Smoke-test `https://www.peng-zhan.com/api/site-config`,
   `/api/products?v=2`, login from `/#/creator`, Factory/API role separation,
   inquiry form and one permitted image upload via staging first.
   Do not generate bulk live account failures or post test inquiries to actual clients.
   Monitor production request errors and Cloudflare Security Events.
4. **Rollback**: restore the previous Production `PZ_BACKEND_WORKER`
   value (legacy URL or unset), and redeploy Production if needed.
   Legacy `workers.dev` remains ON until new route is proven stable.
5. Once new origin and WAF are proven, manage the separate **PR #15 Production
   Worker authentication security deployment** with its own staging tests,
   backup, credential/session transition and review. A gateway cutover does not
   deploy PR #15 Worker code.
6. Only after all clients and deploys are confirmed off `workers.dev`
   should Production `workers.dev` be disabled. At that point remove the
   fallback in a later gateway-only PR and verify rollback provisions.

## Operational notes

- Cloudflare explicitly supports same-zone fetch() from a Pages/Worker gateway
  to a Worker Custom Domain:
  https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Cloudflare Pages runtime variables live under
  `Workers & Pages -> Pages project -> Settings -> Variables and Secrets`.
- A Cloudflare WAF zone rule protecting the custom domain does **not** automatically
  protect the legacy `workers.dev` hostname. Keep the Worker's own
  authentication, role checks and login protections until the old route is off.
- Do not share API tokens, passwords, JWTs, request authorization headers or
  uploaded customer inquiry data in issue comments or screenshots.
- This PR contains no Cloudflare API token and performs no live Cloudflare
  mutation. GitHub CI exercises a mocked gateway; deploy status and real
  end-to-end connectivity must be confirmed separately.
