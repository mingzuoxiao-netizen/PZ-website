# Product form bilingual/specs update — controlled release

This branch is a **candidate only**. No Cloudflare Production Worker, D1,
Pages, KV, or R2 state is changed by merging the code.

## Scope
- Factory and Admin product form: Chinese/English names and descriptions,
  dedicated dimension, material, and surface finish entries.
- SKU input shows `PZ-` once; the editable suffix uses `BIRCH-001` as a
  **format example**, not a reserved product SKU.
- Product preview and image controls respect the requested language.
- Existing D1-backed `name_cn`, `description_cn`, and `size` are reused.
- The new optional `finish` field must round-trip through create, update,
  list, and both public catalog publishing paths. No change to approval logic.

## Required release order
1. Verify backup/recovery readiness, active Worker versions and D1 bindings.
2. On **Staging D1 only**, check `PRAGMA table_info(products);`; if
   `finish` absent, execute migration 007 **once**. Confirm original rows.
3. Deploy the reviewed Staging Worker candidate with the matching schema.
4. Deploy/visit Pages Preview using the feature branch (do not use Production
   or alter `PZ_D1_SITE_CONFIG_ENABLED`). Test Factory create/save/reopen,
   bilingual fields, a finish value, admin review, public projection, images.
5. Run the standard TypeScript/tests/build and check real Staging API behavior.
6. Only after approval, ensure Production D1 backup and run the same
   migration 007 **once**, against the confirmed Production `DB` binding.
7. Deploy the reviewed **full Production Worker** with the existing D1
   config flags unchanged, verify product/inquiry/config endpoints.
8. Deploy the merged frontend Pages Production and smoke-test product
   create/read/edit and approval before permitting bulk use.

## Safety
- Deploying the new Worker **before** the D1 column exists causes
  product queries to fail. Do not skip the migration ordering.
- Deploying the frontend before the backend may silently drop `finish`
  on saves; do not use finish in real products until both are live.
- Existing records default to `finish = ''`; leave them unchanged unless
  an administrator supplies a real finish value.
- Do not flip `PZ_CATALOG_V2_ENABLED` or disable
  `PZ_D1_SITE_CONFIG_ENABLED` as part of this rollout.
- Do not run schema migrations or deploy from a Draft PR.
