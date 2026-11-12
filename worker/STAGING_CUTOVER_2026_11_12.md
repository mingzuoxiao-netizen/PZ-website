# Staging cutover audit — 2026-11-12

Active Staging version inspected in Cloudflare: `1c7f60f8` (manual dashboard deployment). Its exported source is 293,612 LF-normalized characters and begins `STAGING MERGE CANDIDATE`. The repository unified baseline is a newer production-derived bundle; they are not byte-identical. This is an intentional upgrade to the unified source, not a claim that the old live Worker already equals Git.

Staging has five independent bindings (D1, two KV namespaces, two R2 buckets), inspected against active production. Real IDs are held only in GitHub Environment configuration. Existing variables and JWT secret remain on the Worker via keep_vars; source compatibility date moves from the inspected 2026-10-28 to repository 2026-11-10, subject to Staging acceptance. No queues or cron triggers were configured.

The shared baseline hard-coded production guards. The reviewed build adapter enumerates every changed guard, checks exact anchor counts and tests actual rendered Worker auth/isolation routes. Production rendering is unchanged. Runtime-safe image validation forbids production CDN origins in Staging.

Staging release requires `PZ_STAGING_SOURCE_REVIEWED=true` plus `PZ_STAGING_RESOURCES_VERIFIED=true` and explicit production resource comparisons. This replaces the misleading old Staging parity flag: it approves this reviewed candidate for isolated testing, not acceptance or production release. Live acceptance is a separate workflow step. The old active version remains the rollback reference; D1 Time Travel bookmark is recorded before migrations. Production flags and approval workflow are untouched.
