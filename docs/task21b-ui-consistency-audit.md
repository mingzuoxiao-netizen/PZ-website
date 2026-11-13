# Task 21B — Backoffice UI consistency audit (Draft)

Scope: Creator Portal, all role workspaces and Task 16–20 surfaces. Public website and Worker/D1 business logic are unchanged. This branch stacks Task 20 with the unmerged Task 21A baseline, so it is **not a release branch**.

## Page-by-page audit

| Page / feature | Status and action vocabulary | Feedback and safety | Result |
| --- | --- | --- | --- |
| PortalLayout / role navigation | 21A Chinese grouped nav and tokens retained | Mobile selector and focus styling; 44px button floor | Fixed / inherited |
| Admin / Factory / Supervisor workspaces | `保存` / `提交审核` / `发布` nomenclature kept in new flows | Factory unsaved edit / batch navigation uses shared ConfirmDialog; Admin publish, catalog visibility and archive share ConfirmDialog + Toast; Factory new-category actions still have native alerts | Partial |
| RoleHome | No locally defined status colours | Shared skeleton, Button, Chinese sanitized read errors | Fixed |
| CompletenessBoard | Missing-field names preserved | Shared list shell, skeleton, buttons, error/success toast on CSV export | Fixed |
| InquiryManager | Removed local status palette; uses 21A StatusChip + overdue flag | Shared ListShell, FormSkeleton, Button, Toast; success includes customer name | Fixed |
| ProductList / bulk actions | Uses 21A StatusChip; distinct `彻底删除` vs `提交审核` / `下架` | Shared confirm and result toasts; partial failure preserved; backend per-item checks unchanged | Fixed |
| ProductForm / Task 20 autosave | Uses 21A Button/FormField; retains CAS disabled states | Saving success, conflict-safe Chinese error, shared discard/leave confirmations, 20s autosave state retained | Fixed; additional field-by-field inline error polish pending |
| TwoStageProductReviews | One StatusChip dictionary | Shared publish confirmation + specific success toast | Fixed |
| AdminReleaseQueue | One StatusChip dictionary | Shared publication confirmation + Chinese failure feedback; lazy thumbnail decoding | Fixed |
| PublishedRevisionQueue | Retains status criteria | Shared submit/publish/cancel confirmation and Toast | Fixed |
| BulkCsvImporter / Task 15 | `保存` for create-draft confirmation | Shared ConfirmDialog/Toast; retains batch reconciliation safeguards | Fixed; field guide Task 22 separate |
| BatchCreator / image intake | Removed per-row ad-hoc status colours; uses common StatusChip | Shared confirmation for mode switch, draft creation, retry, clear and exit; localized save and upload errors; `保存待核对` avoids false-success claim | Fixed; other legacy copy may still need polish |
| NewCategoryRequestHistory / FactoryCategoryManagement | Removed `待部门主管初审` vs `待初审` synonyms and raw `pending` labels | Unified StatusChip; history uses skeleton and toast | Fixed; factory category submit still has native confirm |
| CategoryChangeReview / SupervisorCategoryRequests | Shared StatusChip/ListShell | Shared category-action confirmation and queued toasts | Partial; return reason still uses native prompt |
| AdminFastLanePanel / sampling | Shared `待抽检` / `抽检通过` status chip | Shared confirmations and toasts for enabling trust and sample removal | Fixed |
| AccountsManager / organization | `已启用` / `已停用` common chips | List skeleton, account toggle dialog, creation/reset toasts | Partial; account typed-delete has a separate legacy custom dialog |
| AuditTimeline | Shared `成功` / `失败` / `结果待确认` status chips | List skeleton | Fixed |
| InquiriesPanel (legacy) | No business status | Replaced table spinner with shared skeleton; translated read error | Fixed |
| MediaTools / legacy CollectionManager | `彻底删除` and `删除分类` labels | Shared destructive ConfirmDialog, typed phrase for permanent R2 deletion | Fixed; other legacy English labels remain in CollectionManager |
| SiteBasicsEditor / SiteMediaManager | `保存草稿` and `发布网站配置` kept | Shared publish/discard confirmation; existing notices retained | Partial; notices still use local visual classes |
| ReviewQueue (legacy) | Product/category state now uses StatusChip | Bulk-approve path still uses native confirm | Partial; no business logic altered |

## Remaining release blockers (do not claim acceptance yet)

1. **Visual QA:** The isolated `tests/visual/21b.html` fixture is available, but no desktop/390px screenshots were produced. Local Chromium failed on process singleton socket creation (`EPERM`). Do not check off actual responsive screenshots until a browser capable of running the fixture or a connected Staging environment is available. Run the fixture at 390px and 1440px for dashboard, release queue, inquiry inbox and ProductForm; verify `document.body.scrollWidth <= innerWidth`, focus and tap actions.
   - Local reproduction: `./node_modules/.bin/tailwindcss -i tests/visual/21b-input.css -o tests/visual/21b-generated.css --content './pages/CreatorPortal/**/*.{tsx,ts}' './tests/visual/21b.tsx' --minify`, then `npm run dev -- --host 127.0.0.1`, then `node tests/visual/21b-screenshots.mjs` on a machine with Playwright/Chromium available. Fixture uses fake in-memory data, never Production.
2. **Legacy confirmations and feedback:** FactoryWorkspace new-category alerts, AdminWorkspace unsaved-edit confirmation, SupervisorWorkspace password prompt, CategoryManagement, ReviewQueue, CategoryChangeReview return-reason prompt, legacy image-field alerts, SiteMediaManager/SiteBasicsEditor legacy notice styling and other low-frequency settings flows still have nonshared prompts or inline notification styles. BatchCreator and FactoryWorkspace navigation prompts have been migrated, but the remaining exceptions mean **not zero deviations**.
3. **Images:** Table thumbnail `loading="lazy"` is on ProductList and added to AdminReleaseQueue; however no verified Task 7 sized CDN variant/resize helper exists in this branch. Do not rewrite image URLs with invented width parameters. Recheck actual resized variants after Task 7 source is integrated.
4. **Task 19:** Recycle bin is deliberately deferred by the approved task order. The existing server-supported permanent removal action is explicitly labelled `彻底删除`, never `移入回收站`. The recycle-bin CRUD acceptance criterion is therefore not applicable until Task 19 is enabled.
5. **Dependencies:** PR #71 (21A) and #72–#75 (Tasks 16–20), Staging D1 migration 021/022, and actual role-based Staging verification remain Draft. Merge/rebase these first and then run the final full UI audit against their merged result.

## Automated checks

- `npm run typecheck`, `npm run build`: run locally.
- `node --import tsx --test tests/*.test.tsx`: full test suite; equivalent to `npm test` without the environment-blocked tsx CLI IPC socket.
- Added regression tests for status aliases, safe Chinese error messages, token contrast >= 4.5:1, minimum button target 44px, and shared confirmation flows.
- No Worker/D1 edits in Task 21B; no new polling in Task 21B.

The task remains **Draft/in progress** until the above blockers are resolved and the acceptance criteria are actually observed.
