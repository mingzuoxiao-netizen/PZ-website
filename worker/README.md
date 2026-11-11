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
4. Set up GitHub Environments `staging` and `production`. Configure `production` **required reviewers** and restrict the deployment branches/tags; without this protection, do not set the production approval flag. Staging uses no required reviewer so merging can deploy automatically after opt-in.
5. In each environment, configure GitHub variables: `PZ_D1_NAME`, `PZ_D1_ID`, `PZ_SITE_CONFIG_KV_ID`, `PZ_PRODUCT_IMAGES_BUCKET`, `PZ_SITE_CONFIG_HISTORY_BUCKET`. Use actual matching binding resources. Also add secrets `CLOUDFLARE_API_TOKEN` (least privilege for the isolated Worker and resource binding) and `CLOUDFLARE_ACCOUNT_ID`; never place their values in YAML/TOML/source.
6. Initially run CI dry-run without deployment. After comparing active Staging Worker and testing all roles, set the **staging environment variable** `PZ_STAGING_PARITY_CONFIRMED=true` and repository variable `PZ_STAGING_CI_ENABLED=true`. Only then does a merge touching `worker/**` deploy staging and run read-only smoke tests.
7. Validate `/version`, `/public/products?v=2`, `/api/site-config`, unauthorized admin read, and the existing product-review regression suites. Manually validate the real 3-role flow and correct tenant data in staging; this script deliberately never creates/publishes/deletes live catalog records.
8. Only after live staging parity and the GitHub Environment protection are proven, set `PZ_PRODUCTION_APPROVAL_CONFIRMED=true` **in the production environment**. Release via tag `pz-worker-v*` or `workflow_dispatch` from main. Approve the protected environment when GitHub requests review. Confirm its `/version` Git SHA before declaring deployment complete.
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

- Active Cloudflare Worker source, compatibility date, resource IDs, route registrations and actual staging parity cannot be read from GitHub; they require an authorized Cloudflare inspection.
- GitHub Environment required-reviewer policy cannot be configured by merely merging YAML; it must be enabled and verified by a repository administrator.
- Worker metadata has not been wired into the frontend site-config version UI, because doing so now would alter the existing public API contract and requires a separately checked gateway update.
- This PR does not deploy, change a binding, migrate D1, modify content, or assert live production parity.
