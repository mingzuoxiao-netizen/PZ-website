# PZ Security Hardening — PR #15

This change is **not** a production deployment. Review and test the Pages and standalone Worker changes separately.

## Scope
- Public brochure pages do not ship a fake password gate. A client-side password is NOT access control. If the brochure site needs to remain private, configure real edge authentication first (e.g., Cloudflare Access) and do NOT release the public UI change alone.
- Server-side accounts: minimum 12 characters, maximum 72 UTF-8 bytes (bcrypt limitation), disallow account name in new/reset passwords and a few common values. Existing passwords are not automatically changed; arrange scheduled resets for weak legacy credentials.
- JWT lifetime: 7 days -> 12 hours. The new `phv` password-hash-version claim means an account password reset invalidates previously issued JWTs.
- Login endpoint: bounded JSON request; per-username/per-Cloudflare-client-IP attempt threshold (7 failures within 10 minutes), persisted in existing `SITE_CONFIG_KV` under SHA-256 anonymized keys. KV writes are **not atomic**, so **Cloudflare WAF rate limiting must also be configured** to protect against concurrent and distributed brute-force attempts. The proxy-to-Worker hop might change the client IP; confirm end-to-end behavior with actual requests.
- Browser API clients: authenticated helpers reject remote/absolute endpoints, preventing accidental Bearer token forwarding to external URLs.
- Static Pages and API gateway: baseline nosniff, referrer, frame and permissions headers; sanitized upstream exception messages.

## Staging authentication smoke checks (safe, no business writes)

After deploying the **candidate Worker only to isolated Staging** (with a separate staging D1/KV/R2 binding), run:

```sh
npm run security:staging
```

This verifies that anonymous requests to Admin/Factory/Audit are rejected, malformed login payloads fail, and 7 failed login attempts for a **random non-existing synthetic account** trigger a 429 on attempt 8. It never changes products, accounts, site content or published configuration. It only creates a temporary KV counter for its synthetic username. The script strictly refuses any Worker host other than `pz-inquiry-api-staging.mingzuoxiao29.workers.dev`.

Optional additional **read-only** authenticated checks can use non-production test accounts via environment variables: `PZ_STAGING_ADMIN_USER`, `PZ_STAGING_ADMIN_PASSWORD`, `PZ_STAGING_FACTORY_USER`, `PZ_STAGING_FACTORY_PASSWORD`. Never commit test credentials or paste them into screenshots. A successful smoke test **does not** prove the deployed staging Worker source matches this PR, so also verify the deployment revision, Worker bindings, and rollback ID in Cloudflare Dashboard.

If the script fails because Staging is still running the old Worker, **do not change Production**. If the counter fails intermittently under concurrent traffic, that confirms a need for Cloudflare WAF / a stronger transactional rate-limit approach.

## Production deployment — mandatory order
1. Back up current live Worker code and record the deployed release ID, Worker binding names and Cloudflare Pages deployment ID.
2. Verify Preview Pages is bound **only to staging Worker + staging D1/R2/KV**.
3. Deploy an equivalent PR #15 **authentication security patch** to the dedicated Staging Worker **first**. The checked-in `worker-patches/production-worker-category-governance-REVIEW.js` is a **production-oriented bundle** containing production-only site-config/category branches; do **not** blindly replace the whole existing Staging Worker with it. Apply the security changes to the actual Staging Worker source, review the diff, and confirm it uses isolated staging bindings and has no hard-coded secret values.
4. Check login success/failure, seven consecutive bad password attempts, 429 responses, 10-minute expiration (test with a staging-only reduced window if needed), admin and factory route authorization, existing accounts, new/reset password acceptance, disabling users, and fresh login after password reset. Confirm normal audit logging and product approval still work.
5. Configure Cloudflare WAF/rate limiting for `www.peng-zhan.com/api/login` **AND separately eliminate/protect the direct Worker route**. Important: a zone WAF rule on `peng-zhan.com` does **NOT** automatically cover `*.workers.dev`. Cloudflare recommends production Workers use a Route or Custom Domain instead of `workers.dev`. Migrate the Worker to a custom domain and update/test the Pages proxy **before** disabling its current workers.dev route (disabling prematurely would break the website API). Alternatively assess Worker-level Cloudflare Access and service credentials, but do not enable Access on the whole backend without ensuring the public Pages gateway can authenticate to it. See https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ and https://developers.cloudflare.com/workers/configuration/cloudflare-access/. MFA/Cloudflare Access for the Admin surface is separate: hash-based SPA routes (`#/creator/admin`) cannot be protected by Cloudflare path rules alone; consider a dedicated admin hostname/path and secure all admin API requests.
6. QA the PR Preview: public homepage now loads without a local passcode; verify navigation, category browsing, API catalog, inquiry Turnstile, Admin/Factory login, responsive layouts.
7. Separately deploy the audited Worker to Production, ensuring `JWT_SECRET`, `SITE_CONFIG_KV`, `DB`, R2 and runtime environment remain correctly bound. **All previously issued sessions will be rejected and users must log in again.**
8. Release the Pages frontend only after Worker validation and explicit approval. Verify Pages deployment status and run production smoke tests; do not assume GitHub merge proves Cloudflare deployment.
9. Monitor unauthorized/429 responses, worker exceptions, R2 uploads, site-config publishing and audit log consistency.

## Rollback / compatibility
- Rolling back to the old Worker can re-accept still-unexpired legacy JWTs. Avoid emergency rollback that quietly reopens old sessions; revoke/rotate credentials appropriately.
- Login throttling uses `SITE_CONFIG_KV` and may lock out a single username+client-IP for 10 minutes. Do not clear unrelated `draft:` or `published:` keys.
- The former *public-site* passcode was visible in shipped JavaScript / Git history and must never be reused for real access control.
- Frontend still uses remote Tailwind/esm importmap and inline config. A strict Content Security Policy is **not applied here** because it would currently break the site; migrate dependencies to local Vite/Tailwind bundles, test Turnstile and preview, then introduce CSP in a separate change.
- Need separately review production Cloudflare TLS, WAF, Turnstile hostname bindings, R2 public object policy and API direct worker URL restrictions.
- Security testing is limited to code-level checks and Preview smoke tests; no penetration test or production WAF verification has yet been completed.

## Known environment limitation

The GitHub connection does not provide Cloudflare Dashboard deployment credentials. The staged Worker was not deployed or tested live as part of PR #15. The public read-only URL check could not confirm the staging Worker endpoint from the assistant environment, so treat Staging tests as pending until a real test log is available.
