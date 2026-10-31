# PR #6 category release gate — Staging only

## UI changes implemented
- Admin sidebar now has **产品分类封面**: each published/draft-approved site's category cover with image upload, preview, save draft and publish buttons.
- Existing site-image editing now loads **admin/draft/site-config** rather than a published copy. This prevents saved covers reverting on refresh.
- Factory proposal form has English `title`, optional Chinese `title_cn`, image and description.
- Admin ReviewQueue uses the category-specific approval/rejection handlers. Category bulk approvals run **sequentially** to reduce lost category updates to KV.
- Approval is only reported publicly successful if the Worker returns `published: true` and the public site-config contains the matching `proposal_id`.
- Home shows the three curated categories plus approved new categories; Portfolio and menus use the published categories, mapping Worker `title_cn` to frontend `title_zh`. There is no dependency on an approved product SKU to display a category.

## IMPORTANT backend compatibility blocker
The saved standalone Worker source `PZ-Worker-V3.2-UNIFIED-REVIEW.js` has ADMIN GET/approve/reject category routes. It **does not contain** a `POST /factory/category-requests` or `POST /factory/category-requests/:id/submit` handler. The deployed Worker V3.2.1 may differ; inspect its actual routes rather than assuming either route exists.

**Do not merge this PR or release Production unless the Staging Worker proves both factory endpoints are implemented.** A failing Staging test requires a separately reviewed Worker fix, validated against the actual Staging D1 `category_requests` table schema. Do not edit Production Worker/D1/KV/R2 as part of this test.

## Staging end-to-end acceptance test
1. Confirm Preview Pages `PZ_BACKEND_WORKER` points to `pz-inquiry-api-staging`, and Staging uses its own D1/KV/R2.
2. Login with FACTORY role. Propose category `PZ-QA-NEW-CATEGORY`, Chinese title `测试新品类`, upload a Staging R2 cover, and click **提交审核**.
   - Expected: factory create returns a draft `id`; submit transitions to `awaiting_review`.
   - Failure: a 404, 405 or missing `id` means this workflow is **not supported** by the currently deployed Worker.
3. Before approval, GET Preview `/api/site-config`: category must NOT be in published `categories`. Unapproved category should not appear on homepage or Products.
4. Login with ADMIN. Open **审核中心 → 待审核新品类**. Check the proposal and cover. Reject one test proposal and verify it does NOT appear in public categories.
5. Create a second test category. Approve it as ADMIN. Verify response `success:true, status:'approved', published:true`. If `needsPublish:true` or `published:false`, this is a warning, not a successful public publish.
6. GET Preview `/api/site-config` after approval; exact `proposal_id`, `categoryId`, name and image must match. Verify Products category tile, Home appended category tile, and EN / 中文 navigation.
7. In ADMIN **产品分类封面**, replace its cover with a second test image, **保存草稿** then **发布到网站**. Verify refreshed public site-config and Products and Home use the new image.
8. Confirm FACTORY cannot call ADMIN approval endpoints. Check new categories are not published merely by uploading an image.

The category approval code in the saved V3.2 Worker creates published KV config from the **draft** and may return `needsPublish` on failure. This is why client verification is mandatory. Avoid approving multiple proposals simultaneously from separate sessions.

## Release policy
Keep PR #6 Draft, Production Pages automatic deploy paused, and `PZ_CATALOG_V2_ENABLED=false` until targeted Staging QA passes.
