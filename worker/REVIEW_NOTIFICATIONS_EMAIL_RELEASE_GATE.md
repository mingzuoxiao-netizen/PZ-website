# Task 14 — Review notifications and opt-in email release gate

Status: **Draft. NOT DEPLOYED. NO MAIL SENT.** This change is stacked on
PR #63 and depends on PRs #61/#62/#63 and the separate Cloudflare staging
isolation deployment gate.

## Why email requires explicit setup

The current `users` table contains usernames, not employee email addresses.
Never derive recipient addresses from usernames or silently send to all employees.
Each employee, supervisor and Admin sets their own email in the bell menu,
receives a six-digit verification code and must enter that code to opt into
email. Unverified or disabled accounts still receive the in-app notification.

Email provider chosen: **Resend Email API** (`POST https://api.resend.com/emails`).
The provider must verify the sender's DNS/domain first. This PR does NOT
create a Resend account, alter DNS, store an API key or configure an address.

## Implementation

1. Staging-only D1 migration:
   `worker-patches/migrations/019_review_notifications_email_REVIEW.sql`.
   It creates `pz_notification_email_settings` and `pz_notifications`, with
   review-event triggers for product submissions, returns, supervisor approvals,
   final publications, published-product revisions, fast-lane publishes,
   and sample-unpublished events.
2. The same D1 transaction that writes the existing audit event inserts
   notifications for the correct supervisor/Admin/submitter. On a rollback,
   neither the review event nor the in-app notification persists.
3. The outer Worker notification middleware offers:
   - `GET /notifications` — current account's inbox and unread total
   - `GET /notifications/unread-count` — current account unread count
   - `POST /notifications/:id/read` and `POST /notifications/read-all`
   - `GET /notifications/product?id=...` — product details only if the
     account received a matching notification (cross-account reads return 404)
   - `GET/POST /notifications/email/preferences`
   - `POST /notifications/email/request-code` and
     `POST /notifications/email/verify`
4. Review events trigger a `ctx.waitUntil` email-outbox drain
   **after** the main API response. Provider errors or timeouts never undo
   successful approval/return/publish. Idempotency-Key identifies each email
   separately; a failed send is attempted at most twice and the D1 row stores
   the final `sent`/`failed` state and provider ID/error type. No API keys,
   mailbox addresses, or full provider responses are logged.
5. Only verified/opted-in addresses, and notifications created *after*
   the latest opt-in, can be delivered. Six-digit verification uses a
   15-minute expiry, a one-minute resend cooldown, a five-attempt lockout
   and an HMAC of user ID + email + code with a Worker-only pepper.
6. Browser bell shows role-appropriate new/unread notices; mail deep links
   open the authorized review detail in that person's notification panel.
   The existing header badge poll interval remains 60 seconds; it does not
   increase existing backoffice list polling frequency.

## Configure Cloudflare **staging** only (AFTER checking resource isolation)

- **Secret** `NOTIFY_RESEND_API_KEY`: scoped Resend API key for this project.
- **Secret** `NOTIFY_VERIFICATION_PEPPER`: unique, cryptographically random
  secret of at least 24 characters, never committed or reused from Production.
- Environment variable `NOTIFY_FROM_EMAIL`: a sender address belonging to
  a *verified* sending domain, e.g. `PZ Updates <notify@your-verified-domain>`.
  The example is not an actual mailbox/domain to use.
- Environment variable `NOTIFY_APP_BASE_URL`: the actual publicly reachable
  **HTTPS** Staging Pages origin; no credentials, query strings or URL fragments.
- No Gmail OAuth, personal email password, SMTP login, Cloudflare global API
  token, or hardcoded account-specific mail address is needed.

With these values absent, **in-app notifications still work**; email verification
is reported unavailable and no external mail is sent. Secrets must be set
in the actual Cloudflare Worker runtime (they are not embedded by Wrangler).

## Staging acceptance checklist

- [ ] Audit separate Staging D1/KV/R2 IDs and Worker bindings (Task 10).
- [ ] Back up Staging D1 and apply migration 019 **only there**. Confirm triggers
  after existing migration 018 is installed, and confirm D1 `PRAGMA foreign_keys`.
- [ ] Deploy new Worker and Pages to Staging (not Production), preserving
  all production Environment Required reviewers.
- [ ] Three roles sign in and confirm notification bell and per-role unread count.
- [ ] Factory submit → assigned Supervisor only; field return → operator with
  field issues; Supervisor approve → Admin(s); Admin publish → operator.
- [ ] Published revision submit/approve/publish and fast-lane publish/sampling
  produce matching inbox notices, with no irrelevant recipient.
- [ ] Click email deep link: authenticated role can view the referenced review;
  unrelated role cannot see another user's inbox or private product details.
- [ ] Before verification: no review email. Verify real inbox with six-digit code,
  receive *future* events only, then toggle email off and confirm no further mail.
- [ ] Invalid/expired codes and rapid verification retries fail safely.
- [ ] Simulate provider 503: review remains successful, notification exists,
  email delivery attempts and safe error are visible in D1. No repeated email
  caused by a duplicate API retry.
- [ ] Deploy to Production ONLY after Staging results, domain DNS readiness,
  and the protected GitHub Environment human approval; **do not silently
  copy staging mail/API credentials to production**.

## Notes / limitations

- Every user must explicitly verify an email. The current account schema does
  not provide recipient email addresses or centralized staff distribution lists.
- To avoid accidental historical backfill, notifications older than the latest
  verification/opt-in timestamp are not sent by the mail drain.
- An optional generic chat webhook from the earlier task list is NOT added by
  this PR: the user's explicit email requirement is implemented instead.
  If webhook push is later desired, add it as a separately audited integration.
- Cloudflare staging D1 migration and verified Resend sender-domain setup
  remain user/account-admin tasks; CI success alone is not a live mail test.
