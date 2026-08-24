# MT-STORY-020 — Email Verification

## Context / assumptions
The codebase currently contains only registration (`MT-STORY-013`): `POST /api/register`,
an in-memory `userStore`, and a validator. There is **no login/session system yet** — the
epic frames sign-up, login, and session management as separate concerns, and only sign-up has
been built so far. This creates two scoping decisions for this story:

1. **"Access to the application" / "requires authentication" (AC1, AC2).** Since no
   login/session exists, there is nothing today that issues a session to prove who is
   calling. To make the "hard gate" testable without building a full login feature (out of
   scope for this story), this plan adds the smallest possible stand-in: requests identify
   themselves with an `x-user-id` header (the id returned at registration), and a
   `requireVerifiedUser` middleware checks `verified` on that user before allowing access. A
   new minimal protected route, `GET /api/account`, is added purely to exercise this gate —
   it represents "any part of the application that requires authentication" until a real
   login/session story replaces the header with a session. **This header is explicitly not
   real authentication** — anyone who knows a user's id can claim to be them, since there is
   no password/session check behind it. That is an accepted, documented limitation of this
   placeholder, not a security bug to fix here; a future login story must replace `x-user-id`
   with a real session before this gate is meaningful in production. It is called out again
   in "Out of scope" below.
2. **"Offered a path to log in" (AC3).** No login endpoint exists to link to. The response
   satisfies this via message copy ("please log in or request a new link") plus a real,
   working resend action (the same endpoint AC4 requires). No fake `/api/login` route is
   created.

**Email delivery**: no SMTP/mail provider is configured anywhere in this repo (`.env` has no
mail settings). "Sending" a verification email is represented by an in-memory `emailService`
outbox (same pattern as `userStore`'s in-memory `Map`) that records `{ to, token }`. Tests
read the token from this outbox, mirroring "the user received an email and clicked the link."

**Token expiry in tests**: `verificationTokenStore` exposes an `expire(token)` test helper
(same spirit as `userStore.reset()`, which already exists purely to support test isolation)
to deterministically simulate an expired token without waiting out the real TTL.

## File layout — files to create/modify
```
src/store/userStore.js                    # modify: add verified:false-friendly save, findById()
src/store/verificationTokenStore.js       # new: in-memory token records + reset()/expire() test helpers
src/services/emailService.js              # new: in-memory outbox (sendVerificationEmail, getLastEmailTo, reset())
src/middleware/requireVerifiedUser.js     # new: gate middleware (AC2)
src/routes/account.js                     # new: GET /api/account, protected sample route (AC1/AC2)
src/routes/verification.js                # new: GET /api/verify-email, POST /api/resend-verification (AC1/AC3/AC4)
src/routes/registration.js                # modify: mark verified:false, issue token, send email on register
src/app.js                                # modify: mount account + verification routers
tests/verification.test.js                # new: one describe block per AC, plus edge/security cases
```

## Data model changes
- `User` gains `verified: boolean`, defaulting to `false` at registration.
- New `verificationTokenStore` record: `{ token, email, expiresAt, used }`.
  - `create(email, ttlMs = 24h)` → generates `crypto.randomUUID()` token, stores record, returns token.
  - `findByToken(token)`
  - `markUsed(token)`
  - `expire(token)` — test-only helper, sets `expiresAt` into the past.
  - `reset()`
- New `emailService`: `sendVerificationEmail(email, token)` pushes `{ to: email, token }` to an
  in-memory array; `getLastEmailTo(email)`; `reset()`.

## TDD build order

### Step 1 — AC2: unverified user is blocked from authenticated access
This is built first because it only needs the `verified` flag (already implied by
registration) plus a gate — no token/email plumbing yet — so it is the smallest possible
first slice.

- **Failing tests first** (`tests/verification.test.js`):
  - Register a user (unverified by default), then `GET /api/account` with header
    `x-user-id: <that user's id>`; expect `403` and an error message matching
    `/verify.*email/i`.
  - Same request with no `x-user-id` header at all → `401`.
  - *Security:* `x-user-id` set to a syntactically valid-looking but unknown UUID → `401`,
    not a crash or a `500` (no stack trace leakage).
  - *Security:* `x-user-id` sent as a repeated header (Express parses repeated headers as an
    array) → handled safely as "no valid identity", `401`, not a crash from calling
    `.toLowerCase()`/similar on an array.
- **Minimal code to pass:** add `verified: false` when creating the user in
  `src/routes/registration.js`, building the user object from an explicit field allow-list
  (`id`, `name`, `email`, `dateOfBirth`, `verified`) rather than spreading `req.body`, so a
  client cannot mass-assign `verified: true` on registration; add `findById(id)` to
  `src/store/userStore.js`; create `src/middleware/requireVerifiedUser.js` (guards
  `typeof userId === 'string'` before lookup; `401` if no matching user, `403` with the
  verification message if `!user.verified`, else `next()`); create `src/routes/account.js`
  with `GET /api/account` returning an explicit field allow-list (`id`, `name`, `email`,
  `verified`) rather than `req.user` directly, so no incidental internal field is ever
  exposed; mount it in `src/app.js`.
- **Security regression test (same step):** `POST /api/register` with
  `{ ...validPayload(), verified: true }` in the body → the created account is still
  `verified: false` (mass-assignment / self-verification guard).
- **Files:** modify `src/routes/registration.js`, `src/store/userStore.js`, `src/app.js`;
  create `src/middleware/requireVerifiedUser.js`, `src/routes/account.js`.

### Step 2 — AC1: clicking a valid confirmation link verifies the account and grants access
- **Failing tests first:**
  - Register a user, read the verification token via
    `emailService.getLastEmailTo(email).token`, then `GET /api/verify-email?token=<token>`;
    expect `200` and a message matching `/verified/i`. Then repeat the Step 1 `GET
    /api/account` call with the same `x-user-id`; expect `200` (no longer blocked) and body
    `{ verified: true, ... }`.
  - *Security:* the `POST /api/register` response body never contains the token or any
    token-shaped field (`res.body.token`, `res.body.verificationToken`, etc. all
    `undefined`) — the only way to obtain it is via the "email" (the outbox).
  - *Security:* registering two different users produces two different tokens (basic
    uniqueness check via the outbox), guarding against a broken/constant token generator.
- **Minimal code to pass:** create `src/store/verificationTokenStore.js` and
  `src/services/emailService.js`; in `src/routes/registration.js`, after saving the user,
  create a token and call `emailService.sendVerificationEmail(user.email, token)`; create
  `src/routes/verification.js` with `GET /api/verify-email` that looks up the token, and on a
  valid/unused/unexpired token sets `user.verified = true`, calls
  `verificationTokenStore.markUsed(token)`, and responds `200`; mount the router in
  `src/app.js`.
- **Files:** create `src/store/verificationTokenStore.js`, `src/services/emailService.js`,
  `src/routes/verification.js`; modify `src/routes/registration.js`, `src/app.js`.

### Step 3 — AC3: an already-used verification link
- **Failing tests first:**
  - Register a user, verify successfully once (as in Step 2), then
    `GET /api/verify-email?token=<same token>` again; expect `410` and an error message
    matching `/already been used/i` and `/log in|new (verification )?link/i`.
  - *Edge case:* `GET /api/verify-email` with no `token` query param → `400`, not a crash.
  - *Security/type-confusion:* `GET /api/verify-email?token=a&token=b` (Express parses
    repeated query params as an array) → treated as invalid input, `400`, not a crash from
    doing a Map lookup with a non-string key.
  - *Edge case:* a syntactically plausible but never-issued token (random UUID) → `400`
    "Invalid verification link" — a distinct response from both the used-link and
    expired-link cases, so the three states are never confused.
  - *Precedence/security:* a token that is **both** used and expired (verify it, then also
    force-expire it) → response is still the "already used" `410`, not the "expired" one —
    locks in that "used" takes priority so a stale-but-once-valid token doesn't get a
    misleading "just try again by requesting a new one, it expired" message when it was in
    fact already consumed.
  - *Idempotency:* verifying an already-verified account through a **second, still-valid,
    unused** token (e.g. issued by a resend before the first token was clicked) succeeds
    (`200`) rather than erroring — re-verifying an already-verified account is not an error
    state under any AC, so it must not crash or behave inconsistently.
- **Minimal code to pass:** in `src/routes/verification.js`, validate
  `typeof token === 'string' && token.length > 0` before any lookup, returning `400` early
  otherwise; look up the record and return `400` if not found; check `record.used` before
  the expiry check; if used, respond `410` with a message stating the link was already used
  and to log in or request a new one; verifying while already `verified: true` simply
  re-confirms and responds `200` (no special-casing needed beyond "success" branch already
  setting `verified = true` and marking the token used).
- **Files:** modify `src/routes/verification.js`.

### Step 4 — AC4: an expired verification link (+ resend)
- **Failing tests first:**
  - Register a user, use `verificationTokenStore.expire(token)` to force expiry, then
    `GET /api/verify-email?token=<token>`; expect `410` and an error message matching
    `/expired/i` mentioning resending.
  - `POST /api/resend-verification` with `{ email }` for that same (still-unverified) user;
    expect `200` and confirmation the email was resent; assert `emailService.getLastEmailTo`
    now returns a **new** token; `GET /api/verify-email` with that new token succeeds (`200`).
  - *Edge case:* resend for an unknown email → `404`.
  - *Edge case:* resend with missing `email` field → `400`.
  - *Security/type-confusion:* resend with `email` as a non-string (array/object), mirroring
    `registrationValidator`'s existing non-string-email handling → `400`, not a crash.
  - *Case-insensitivity:* resend using a differently-cased email (`JANE.DOE@EXAMPLE.COM`)
    still finds the account, consistent with `userStore.findByEmail`'s lowercasing.
  - *Security:* resend for an **already-verified** account → `400` and, critically, no new
    entry is added to `emailService`'s outbox (assert outbox length/contents unchanged) — an
    already-verified account is never re-emailed or given a live token again.
- **Minimal code to pass:** in `src/routes/verification.js`, add the expiry check (after the
  used check) responding `410` with an expired message; add `POST /api/resend-verification`
  that validates `email` is a non-empty string, looks up the user, returns `404` if not
  found, returns `400` **before** any token/email side effect if already verified, otherwise
  creates a new token via `verificationTokenStore.create` and sends it via `emailService`.
- **Files:** modify `src/routes/verification.js`.

## Test hygiene
- `tests/verification.test.js` calls `userStore.reset()`, `verificationTokenStore.reset()`,
  and `emailService.reset()` in `beforeEach` for isolation.
- Each `describe` block is labeled with its AC number (`AC1`..`AC4`); edge/security cases are
  nested under the AC they harden (e.g. `AC3 / security: type confusion on token`), matching
  the existing convention in `tests/registration.test.js`.

## Out of scope (explicitly not built)
- Real login/session management — tracked separately per the epic; this story only adds the
  `x-user-id` + `requireVerifiedUser` gate as the minimal seam a future login story will sit
  behind. As stated above, this header is not a real credential check and is not hardened
  against impersonation — that is deferred to the login story, not a gap in this one.
- Real email delivery/SMTP integration — no mail provider is configured in this repo; the
  in-memory outbox stands in for "an email was sent."
- Rate-limiting or throttling of resend requests — not required by any AC.
- Invalidating older, still-unexpired tokens when a new one is issued via resend — not
  required by any AC (the old token simply continues to exist until it separately expires or
  is used; Step 3's idempotency test explicitly covers that using such a token afterward is
  safe, not an error).
- Timing-attack-resistant token comparison — token lookup is a plain `Map` key lookup.
  Tokens are high-entropy (`crypto.randomUUID()`), and no ADR or AC calls for constant-time
  comparison; noted here as a deliberate, not accidental, omission.
