# PZ Bulk Import v2 — ONE ZIP with XLSX + SKU image folders

**Status:** Draft PR #69, based on `main`. This replaces the CSV + manually
renamed images interface merged through PR #65. No production deployment and no
new D1 migration are part of this PR.

## What the employee does

1. In Admin or Factory backoffice, select **Excel + 图片一键导入**.
2. Download the sample **ZIP**. It contains `产品资料.xlsx`, an empty `images/`
   folder and a small README. The Excel has product columns, units and an
   `__example=YES` sample that is ignored by the importer.
3. Fill up to **100 SKU** rows in the workbook; place arbitrary JPG/PNG/WebP
   images under `images/<SKU>/`. The names inside folders can stay exactly
   as exported by a camera. For example:
   ```
   PZ-batch.zip
     产品资料.xlsx
     images/
       PZ-TABLE-001/
         DSC_2041.jpg
         DSC_2042.jpg
       PZ-CHAIR-008/
         DSC_3041.png
         cover.jpg
   ```
   A ZIP created by compressing the enclosing batch folder is also accepted
   (one top-level directory with the XLSX and `images/` folder).
4. Upload **one ZIP**. The browser parses the Excel locally, matches each
   `images/<SKU>` folder, runs Task-11 preflight and checks known SKUs through
   the authenticated Worker endpoint. It does not upload any photos until
   the employee confirms.
5. Use the thumbnail preview to select the main image, change image roles
   (default nonmain is lifestyle/product display), and move nonmain photos
   up or down. An image named `main` or `cover` is selected initially;
   otherwise the first image is suggested **but must be confirmed**.
6. Confirm once. At most **three R2 uploads** run concurrently. Successful
   upload URLs are cached in the browser session, so retrying a failed
   upload does not upload successful files again. Only after the requested
   photos are uploaded does the browser submit the authenticated batch to
   D1 as **Draft**. There is no automatic submit, review or publish action.
7. Save the batch UUID. Admin and Factory can filter their catalog by this
   UUID. If the D1 write returns an uncertain network state, the UI requires
   a batch reconciliation rather than making a second import.

## Security and resource limits

- ZIP <= **180 MiB compressed**, <= **360 MiB expanded**, <= **1350 entries**;
  individual image <= **12 MiB**, inner XLSX <= **8 MiB**.
- Local ZIP extractor validates central/local file headers, CRC32, lengths,
  compression ratios, duplicate paths, encrypted entries, symbolic links and
  path traversal. Only ZIP stored/deflate methods are accepted; ZIP64 and
  multipart ZIPs are rejected.
- XLSX reader rejects VBA/macro payloads, external workbook links, formula
  cells and DTD/entities; it reads a visible `Products` / 产品资料 sheet with
  canonical column headings. Shared-string and inline-string cells are supported.
- Images must have matching supported binary signatures, not merely an
  image extension. The existing Worker `/upload-image` route also re-checks
  bytes and stores in the environment's R2 bucket.
- No client-supplied URL or local ZIP path is trusted by the importer. Existing
  `/factory|admin/products/import-drafts` Worker endpoints still recheck
  Task-11 product/preflight fields, R2-origin image URLs, owner RBAC and
  globally normalized SKU uniqueness.
- Missing photo folders can still produce editable **drafts**, but those
  drafts do not meet the publish-readiness image requirements and cannot
  be submitted until images are completed.
- There is **no new D1 migration**: the existing import-batch tables from
  migration `020_bulk_draft_import_REVIEW.sql` continue unchanged.

## Staging acceptance

1. Confirm Staging D1/KV/R2 resources are separate from Production and that
   existing migration 020 is installed in Staging. Back up D1 before altering
   any deployment/binding; do not blindly rerun migration 020.
2. In a separate Staging environment, verify the existing Worker import flag
   `PZ_BULK_IMPORT_ENABLED` has the intended value. Keep Production disabled
   unless separately approved.
3. Download the new ZIP template from both Admin and Factory. Open its Excel
   workbook in desktop Excel and save it, then zip the workbook with one or
   more SKU folders. Test that original camera filenames work without any
   `SKU__main` renaming.
4. Preview multiple photos for each SKU, select/confirm a main image and
   reorder role tags. Verify the intended image is first and that the
   resulting `media_roles` follow the displayed roles.
5. Upload a workbook with **100 SKUs, 5 deliberately malformed rows**.
   Expect **95 new Draft products, 5 invalid rows and 0 published**.
   Repeat in a new UUID batch: expect 0 inserts and existing SKUs skipped.
6. Test an orphan image folder, missing image folder, duplicate SKU,
   multiple cover photos, folder-wrapped ZIP, a bad file signature, overly
   large ZIP, duplicate path names and malformed XLSX formulas. Import must
   either show a clear reason or safely reject the archive.
7. Simulate one R2 image upload failure: the D1 draft batch must **not**
   start. The same browser session may retry only failed images.
   Simulate a lost D1 response and verify the batch-reconciliation control.
8. Confirm imported records show under the same `import_batch_id` filter
   in Admin and the assigned operator's catalog; original review permissions
   and Task-11 submit gating remain unchanged.
9. Merge/release only after all CI checks and Staging end-to-end tests; keep
   protected GitHub Production Environment reviewers and manual approval.

## Rollback

This PR only changes the browser-side import UI/parser and tests. Existing
Worker endpoints and D1 migration 020 remain compatible. If the new
client workflow fails Staging acceptance, revert PR #69's import components.
Do not delete already-imported draft rows or alter Production D1 as part of
this rollback.

**Known limits:** No native `.xls`, HEIC or PDF image import. Photos must
be JPEG, PNG or WebP; ZIP must contain a standard `.xlsx` workbook. Large
image sets can be split across batches to stay within the size cap.
