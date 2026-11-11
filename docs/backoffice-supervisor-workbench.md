# Supervisor UX — stage C

Depends on stages A and B. This change does not widen approval, publication or
account permissions.

- New products and published-product revisions share one scoped, paged queue.
- Search/filter by SKU/name, submitting employee and request type. Separate
  actionable states from read-only waiting-for-employee/Admin/publication views.
- First submissions show complete product data; later submissions and revisions
  show changes. Images stay visual and internal specs are optional.
- Successful handoff opens the next actionable record. Returns still need a
  concrete reason; common explanation shortcuts only fill text, never submit it.
- Mobile details replace the long list and provide a return-to-list button.
- Team management adds account-name and enabled/disabled filters while retaining
  the existing department-scoped account lifecycle.

Automated workflow coverage verifies V1 visibility, product-to-revision advance,
correct action endpoints, and the absence of approval actions in waiting views.
Perform real three-role Staging handoff/return checks before release.
