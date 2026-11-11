# PZ Worker source-control migration — task 10

Status: **Migration PR / not yet authorized for a live cutover.** This is the proposed single source of truth after Cloudflare parity is established.

## Source and safety

- `src/index.js` is copied, byte-for-byte, from `../worker-patches/pz-production-unified-v2-2026-11-10.js` on the branch baseline **except** for a read-only `GET /version` endpoint and its build SHA constant. `tests/source-parity.test.mjs` proves this.
- Existing embedded modules remain inline: extracting them could change worker dispatch or ordering, so do not refactor during cutover. TODO: deduplicate in a separate tested PR only after parity.
- The patch file is a *candidate*, not proof of Cloudflare's currently active Worker. Compare the active script/version in Cloudflare before enabling automated deployment. Do not assume a git merge deploys Worker code.
- No credentials, account IDs, Cloudflare API tokens, or real binding IDs belong in Git. The repository's existing `.env` tracking state is **not inspected**; do not open/copy it when preparing this migration.
- `GET /version` returns `{"git_sha":"<full-commit-sha>"}` once stamped by CI. A placeholder in a PR dry-run is not a deployed version.
- No additional public route or changes to the existing `/api/site-config/meta` response are made here. After baseline verification, the front-end can consume `/version` through an explicitly reviewed gateway rule or a metadata integration. Do not mislabel `meta.version = "published"` as a build SHA.

## Cloudflare parity checklist BEFORE turning on automation

1. Export/compare the actual **active** `pz-inquiry-api` and `pz-inquiry-api-staging` Workers in Cloudflare, their active version IDs, compatibility date/flags, domain and route registrations, and any cron triggers. Record discrepancies. This repository alone cannot establish the live version.
2. Confirm staging and production each use the correct **separate** D1 DB binding `DB`, KV binding `SITE_CONFIG_KV`, R2 bindings `PRODUCT_IMAGES` and `SITE_CONFIG_HISTORY`. Match real resources by ID, not name guesswork. Inspect runtime variables and secrets *without copying secret values*.
3. Verify the production name is exactly `pz-inquiry-api`, not `pz-inquiry-api-production`; staging is exactly `pz-inquiry-api-staging`. Confirm the `wrangler.toml` compatibility date and routes match the active Worker. `keep_vars=true` is intentional to protect existing runtime variables; bindings must still be fully declared.
4. Set up GitHub Environments `staging` and `production` in **Settings → Environments**. For `production`, explicitly enable **Required reviewers** and restrict deployment branches/tags. This is the PRIMARY gate: each production run must wait at **Review deployments** until a reviewer approves. Configure reviewer(s) before using the workflow; merely specifying `environment: production` in YAML does **not** create a protection rule. Consider **Prevent self-review** (requires a separate reviewer) and disallowing admin bypass as your team's policy permits. GitHub records the approver and time. The workflow also checks the **current run's** `production` review history using a read-only Actions API call before it can deploy. If no valid approval record is found it fails closed. Staging does not need a reviewer after isolation has been proven.
5. **First audit Cloudflare, then enter any variables.** Confirm `pz-inquiry-api-staging` points to a distinct staging D1, KV namespace, `PRODUCT_IMAGES` bucket and `SITE_CONFIG_HISTORY` bucket, separate from every corresponding production resource. Record the actual production D1/KV IDs and R2 bucket names for comparison. Before that audit, **leave the current empty GitHub variables empty**—incorrect IDs are more dangerous than missing ones. Once checked, configure in the `staging` GitHub Environment: `PZ_D1_NAME`, `PZ_D1_ID`, `PZ_SITE_CONFIG_KV_ID`, `PZ_PRODUCT_IMAGES_BUCKET`, `PZ_SITE_CONFIG_HISTORY_BUCKET`; production comparison references `PZ_EXPECTED_PRODUCTION_D1_ID`, `PZ_EXPECTED_PRODUCTION_KV_ID`, `PZ_EXPECTED_PRODUCTION_IMAGES_BUCKET`, `PZ_EXPECTED_PRODUCTION_HISTORY_BUCKET`; finally `PZ_STAGING_RESOURCES_VERIFIED=true` only after inspecting Cloudflare. The deployment preparation script refuses an equal ID/bucket in staging and production and fails closed when the audit flag or any comparison reference is missing. This comparison is defense-in-depth, not a substitute for the actual Cloudflare audit.

   In `production`, configure its own `PZ_D1_NAME`, `PZ_D1_ID`, `PZ_SITE_CONFIG_KV_ID`, `PZ_PRODUCT_IMAGES_BUCKET` and `PZ_SITE_CONFIG_HISTORY_BUCKET` **only after verifying each against the current active production Worker**.

   **Cloudflare API Tokens belong in GitHub Environment secrets only**, not repository-level secrets, organization-level secrets, files or Git history. Use different least-privilege tokens restricted to the intended account/Worker deployment and required bindings; never use the global Cloudflare API Key. Secret names: `PZ_STAGING_CLOUDFLARE_API_TOKEN` and `PZ_STAGING_CLOUDFLARE_ACCOUNT_ID` only under `staging`; `PZ_PRODUCTION_CLOUDFLARE_API_TOKEN` and `PZ_PRODUCTION_CLOUDFLARE_ACCOUNT_ID` only under `production`. Keep credential scopes minimal, and review Cloudflare's permissions before authorizing deployment.
6. Initially run CI dry-run without deployment. The **manual Run workflow target is now a choice, defaulting to `staging`**. Selecting staging will skip the entire production job. The staging job runs for either a manual staging choice or a `main` push to `worker/**` only when the **repository variable** `PZ_STAGING_CI_ENABLED=true` is enabled; otherwise it is safely **Skipped**, not failed. After auditing staging resources, comparing the active staging Worker and testing all roles, set `PZ_STAGING_PARITY_CONFIRMED=true` in the `staging` Environment alongside `PZ_STAGING_RESOURCES_VERIFIED=true`. Then enable `PZ_STAGING_CI_ENABLED` and launch a manual staging workflow (or push a new worker change). A prior skipped run is not automatically retried.
7. Validate `/version`, `/public/products?v=2`, `/api/site-config`, unauthorized admin read, and the existing product-review regression suites. Manually validate the real 3-role flow and correct tenant data in staging; this script deliberately never creates/publishes/deletes live catalog records.
8. Only after live staging parity, environment reviewer protection, and production binding audit are proven may you release. In **Run workflow**, choose `production` explicitly (or publish an `pz-worker-v*` Release). The production job targets the protected `production` GitHub Environment and **must wait for a fresh human approval for that run**. It then queries GitHub's audit API for an actual `approved` review associated with `production`; without one, it stops before generating bindings. The secondary `PZ_PRODUCTION_APPROVAL_CONFIRMED` flag is an **environment-level** variable and **must not be preset permanently to `true`**: leave it empty/false normally, enable it only for the specific authorized release window, and reset immediately after the release. This flag never substitutes for Required reviewers, and it cannot supply a missing approval record. Confirm the published `/version` Git SHA before declaring release complete.
9. After successful cutover, mark `worker-patches/` archival/historical in its README, and route **all further Worker changes through `worker/`**. Until then, patch sources remain the known candidate baseline.

Do **not** enable either deployment job with the placeholder ID config; `prepare-deployment.mjs` checks nonempty, correctly formatted IDs and blocks placeholder IDs. Its generated `wrangler.generated.toml` is gitignored.

## Commands

From repository root:

```sh
node --check worker/src/index.js
node --test worker/tests/source-parity.test.mjs
node worker/scripts/prepare-deployment.mjs staging dry-run
npx --yes wrangler@4.156.0 deploy --config worker/wrangler.generated.toml --env staging --dry-run
```

To deploy a real staging environment, GitHub must first have the resources and opt-in gates above. `prepare-deployment.mjs staging deploy` fails if the parity flag is not set or IDs are missing.

## Rollback and recovery

- Before any live change: record active Cloudflare deployment version ID and keep it available for rollback.
- If staging smoke fails: do not promote to production. Revert the staging deployment with Cloudflare Dashboard → Worker → Deployments → Rollback, or `wrangler rollback --env staging --config worker/wrangler.generated.toml` where supported, then rerun the smoke checks.
- If production smoke fails: stop release; use Cloudflare Deployments to roll back the exact `pz-inquiry-api` Worker. Preserve D1/R2/KV data (this task performs no data migrations). Use a new PR to correct the source rather than editing live code without recording it.
- Re-deploying a historical git tag: check out the reviewed tag and run the **approval-gated production workflow** from that revision; do not bypass protected environments. Confirm `/version` matches the released commit.
- Rollback of code is **not** a rollback of database schema or data. Confirm the existing Worker schema is compatible with the previous release before restoring.

## Known activation blockers

- Active Cloudflare Worker source, compatibility date, resource IDs, route registrations and actual staging parity cannot be read from GitHub; they require an authorized Cloudflare inspection. No resource identifiers or tokens are populated by this PR.
- GitHub Environment required-reviewer policy cannot be configured by merely merging YAML; it must be enabled and verified by a repository administrator. A missing Required reviewers rule is not considered a completed deployment setup. The read-only approval audit step blocks runs that have no actual production approval record.
- Worker metadata has not been wired into the frontend site-config version UI, because doing so now would alter the existing public API contract and requires a separately checked gateway update.
- This PR does not deploy, change a binding, migrate D1, modify content, or assert live production parity.
