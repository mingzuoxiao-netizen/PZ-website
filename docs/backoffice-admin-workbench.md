# Admin UX — stage B

Depends on the complete list service in stage A; deploy/verify its Staging Worker
before enabling this screen against that backend. No automatic Worker deployment
or Production publishing is included.

- A single globally paged release queue combines new products and revisions.
- Search covers every permitted pending item. Filters narrow by department,
  supervisor and type; oldest waiting items are the default.
- The summary count comes from the full server total, not the loaded page.
- Selection is explicitly page-scoped and cleared on query/page changes. Loading
  and processing disable conflicting actions. Confirmation lists target SKU.
- Existing guarded approve-then-publish operations remain sequential. A failure
  stops the batch and names the current SKU; unresolved visible targets remain
  selected after reconciliation. Successful targets are not replayed.
- Optional detail uses readable fields and product thumbnails. New V1 submissions
  show complete data instead of an empty diff. Internal specs stay collapsed.
- Detail reads are guarded against stale responses. Unsupported legacy backends
  show an update error instead of an empty queue.
- Polling is less frequent and pauses while hidden. Product editing gains dirty
  navigation/unload protection and in-page validation feedback through the shared
  editor; later operator buttons are optional callbacks, not activated here.

Validate single and mixed-type release, current-page selection, filter changes,
page depletion, failure after partial success, failed metadata/service reads and
mobile wrapping in Staging before Production deployment.
