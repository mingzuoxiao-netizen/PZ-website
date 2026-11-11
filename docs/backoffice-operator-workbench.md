# Operator UX — stage D and joint verification

Depends on A → B → C. Draft changes only; no Production deployment or remote D1
mutation is performed by these PRs.

## First-release behavior

- Default to the operator's actionable drafts/corrections. Full server search,
  status/site/category filters and 50-row pages replace the 500-row download.
  Category and status counts describe the complete owner scope. Legacy category
  aliases and uncategorized filters are resolved from complete server facets.
- Returned products show the latest correction reason. Product/revision waiting
  states identify the next reviewer instead of suggesting the employee act.
- Save draft, save-and-submit and save-and-create-next are separate editor intents.
  Submission uses the saved server ID. If submission fails, the existing draft is
  retained and the list is focused on its SKU; no duplicate POST is made.
- Continuous entry clears SKU, identity and images while retaining common fields.
  Copy-as-new whitelists reusable product fields and clears SKU and workflow state.
- Draft errors remain in-page, fields can be located, and data stays intact.
  Dirty navigation/unload protection is active; in-flight work blocks conflicting
  navigation. Entering an editor scrolls its actual containing area into view.
- Current-page selection supports bounded, sequential submissions with one list
  refresh per batch. The server state machine remains the submission authority;
  each submission no longer downloads the first 500 products to guess its state.
- In-flight revisions have full paged search too. Mobile details return to the
  same list; image differences render thumbnails rather than long URLs.
- Category shortcut lists are collapsed to avoid dominating the mobile screen.
  Product text is larger and actions wrap. Destructive Admin bulk actions move
  under an explicit additional-operations disclosure without changing protections.

## Verification and limits

Automated tests use real in-memory SQLite for list scope and 10,005 SKU, plus React
workflow tests for deep search, first-review visibility, guarded publication,
editor intents, draft survival after submit failure and unsaved-data protection.
Local read-only browser preview uses synthetic data. It checks Admin SKU search,
Supervisor first-submission mobile detail and Operator mobile list/editor. All
three rendered without horizontal overflow at 320px. This is not a claim of live
authenticated Staging or Production acceptance.

Before release, deploy the stage-A Staging Worker first and test with real role
sessions: create/save/submit, supervisor approve/return, Admin mixed publish,
correction/resubmit, published revision and failed-network reconciliation. Review
optional 017 indexes separately; no migration is necessary for correctness when
the existing schemas are present. Merge the PRs in dependency order and rerun the
full checks after retargeting later PRs to main.

Future enhancements from the approved direction remain separate: personnel
handover authorization, arbitrary spreadsheet import, durable background batches,
server draft recovery and persistent filter restoration across login sessions.
This release does not infer new permissions or invent recovery guarantees for
interrupted browser batches. Real D1 query latency and task-time savings still
need measurement with representative Staging data.
