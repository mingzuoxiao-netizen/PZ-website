# PZ Security Hardening — PR #15

This change is **not** a production deployment. Review and test the Pages and standalone Worker changes separately.

## Scope
- Public brochure pages do not ship a fake password gate. A client-side password is NOT access control. If the brochure site needs to remain private, configure real edge authentication first (e.g., Cloudflare Access) and do NOT release the public UI change alone.
- Server-side accounts: minimum 12 characters, maximum 72 UTF-8 bytes (bcrypt limitation), disallow account name in new/reset passwords and a few common values. Existing passwords are not automatically changed; arrange scheduled resets for weak legacy credentials.
- JWT lifetime: 7 days -> 12 hours. The new `phv` password-hash-version claim means an account password reset invalidates previously issued JWTs.
- Login endpoint: bounded JSON request; per-username/per-Cloudflare-client-IP attempt threshold (7 failures within 10 minutes), persisted in existing `SITE_CONFIG_KV` under SHA-256 anonymized keys. KV writes are **not atomic**, so **Cloudflare WAF rate limiting must also be configured** to protect against concurrent and distributed brute-force attempts. The proxy-to-Worker hop might change the client IP; confirm end-to-end behavior with actual requests.
- Browser API clients: authenticated helpers reject remote/absolute endpoints, preventing accidental Bearer token forwarding to external URLs.
- Static Pages and API gateway: baseline nosniff, referrer, frame and permissions headers; sanitized upstream exception messages.

## Production deployment — mandatory order
1. Back up current live Worker code and record the deployed release ID, Worker binding names and Cloudflare Pages deployment ID.
2. Verify Preview Pages is bound **only to staging Worker + staging D1/R2/KV**.
3. Deploy the revised Worker bundle into a dedicated Staging Worker **first**. Ensure it includes exactly the proposed policy and no hard-coded secret values.
4. Check login success/failure, seven consecutive bad password attempts, 429 responses, 10-minute expiration (test with a staging-only reduced window if needed), admin and factory route authorization, existing accounts, new/reset password acceptance, disabling users, and fresh login after password reset. Confirm normal audit logging and product approval still work.
5. Configure Cloudflare WAF/rate limiting **for both** `www.peng-zhan.com/api/login` and the direct `pz-inquiry-api.*.workers.dev/login` address. The Worker endpoint must not remain an unprotected bypass. Add IP-aware controls and monitor false positives. MFA/Cloudflare Access for administrators is a separate configuration/change: hash-based SPA routes (`#/creator/admin`) cannot be protected by Cloudflare path rules alone; consider a dedicated admin hostname/path and protect all admin API requests.
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
