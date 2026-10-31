# PZ 新品类申请 404 — 已根据真实 Staging D1 修订

**状态：GitHub 补丁已准备；尚未部署到 Staging Worker；Production 不得修改。**

## 已确认事实

- Screenshot: Preview 提交 `Sofa / 沙发` 返回 `{"error":"Not found"}`。
- Existing Worker V3.2 source has no `POST /factory/category-requests`.
- Staging D1 already contains `category_requests`, with 8 columns:
  `id, title, title_cn, subtitle, image, status, created_at, updated_at`.
- `status` default is `pending`; there is no CHECK constraint and currently **zero rows**.
- **No schema migration is necessary**. The old 003 file was replaced with read-only diagnostic SQL.

## New workflow

1. Factory user uploads category-cover image to **Staging R2** using existing `/upload-image`.
2. Factory submits one request to `POST /factory/category-requests`.
3. Worker validates role, title, configured Staging R2 image, duplicates, draft category registry; inserts one D1 row with **status=pending**.
4. Frontend expects `201` JSON `{"success":true,"id":"...","status":"pending"}`. **Do not call `/submit`**.
5. Admin review queue reads category requests with `pending` (and legacy `awaiting_review`); reject/approve continue to use existing ADMIN routes.
6. Approval must return `published:true` and public `/api/site-config` must contain a category with the exact `proposal_id`. The category then appears on Home, Products and navigation, including Chinese title.
7. Admin changes category cover in **产品分类封面**, saves draft and publishes. Public page must show the new cover.

## Apply to CURRENT Staging Worker only

First open **Workers & Pages → pz-inquiry-api-staging → Edit Code**. Preserve a copy of the **current deployed** Worker source and ensure current Staging bindings remain untouched.

Copy the function in [factoryCategoryStaging.mjs](./factoryCategoryStaging.mjs) into the **current Worker source** at top level. The Cloudflare single-file editor requires removing only the `export` keyword from `export async function handleFactoryCategoryRequests`.

Inside current `fetch(request, env)` where `pathname` already exists, insert **inside `try` and before the final Not Found**:

```js
const categoryResponse = await handleFactoryCategoryRequests({
  request, env, pathname, authorize, json, badRequest, pzConfiguredImageBase
});
if (categoryResponse) return categoryResponse;
```

Check the source contains the required existing helpers:
`authorize, json, badRequest, pzConfiguredImageBase`.
The helper checks `PZ_RUNTIME_ENV === 'staging'` and rejects use in Production.

**Do not paste the entire older V3.2 Worker over the current Staging Worker.** The patch is a small addition, not a Worker replacement. No D1 schema writes are needed before deployment.

## Staging end-to-end QA

1. Verify the Preview Pages environment variable `PZ_BACKEND_WORKER` is the staging Worker, never Production.
2. After staging Worker deploy, Factory user submits a uniquely named category (`PZ-QA-SOFA-1030`, Chinese `沙发测试`) with real Staging R2 cover.
3. Confirm one D1 record exists, `status = pending`; public `/api/site-config` and public home do NOT show it yet.
4. Admin enters **审核中心 → 待审核新品类**, views the record and image, tests **reject** on one test request; rejected category must not appear publicly.
5. Create another distinct test category, **approve** via Admin. Verify response `status = approved, published = true`. If `needsPublish = true` or `published = false`, treat that as a partial operation and inspect site config, don't blindly retry approval.
6. Confirm category is present in public `/api/site-config` with correct `proposal_id`, name, image; check Home, Products, navigation and EN / 中文.
7. In Admin **产品分类封面**, replace the category cover, save draft, publish, refresh website, and confirm displayed image URL changed.
8. Verify FACTORY cannot call admin approval; expected HTTP 403. Verify no pending/rejected categories are publicly visible.

## Blockers / caveats

- The **existing** Worker approval handler needs real-world Staging verification, including pending-only transitions and how it updates published KV. It currently updates rows by ID without an expected-state guard.
- Duplicate-category protection at creation is an application-side check, not a DB unique constraint. Do not run concurrent repeated submissions during QA.
- The existing 8-column schema has no `description`; the Factory form has been changed to offer **subtitle** rather than silently discard a description.
- No user_id column: submissions can be reviewed, but per-user ownership audit is **not supported** without future schema work. Role checks remain.
- Do not merge PR #6 or touch Production until Staging is end-to-end verified.
