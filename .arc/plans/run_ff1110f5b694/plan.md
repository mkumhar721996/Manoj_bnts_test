# MT-STORY-019 — User Registration (email verification)

## Context / assumptions
The repo already contains a working registration slice built for a prior story
(MT-STORY-013 "user facebook" sign-up): Express app (`src/app.js`/`src/server.js`),
an in-memory `userStore` (`src/store/userStore.js`), a validator
(`src/validation/registrationValidator.js`) that requires `name`, `email`, `password`,
`dateOfBirth`, and a `POST /api/register` route (`src/routes/registration.js`), all
covered by `tests/registration.test.js`. That prior story's fields (`name`,
`dateOfBirth`) and its validation rules are **not** touched by this story's ACs — they
stay required, since AC5 here maps to the same "missing/malformed email or weak
password → inline error, nothing submitted" behavior that already exists. What's new in
this story is the **account lifecycle**: unverified vs. verified state, dispatching and
resending a verification email, gating login on verification, and a verification-link
endpoint.

No dependency changes: password hashing uses Node's built-in `crypto.scryptSync`
(no bcrypt), and "email dispatch" is modeled as an in-memory outbox (`src/services/mailer.js`)
following the same pattern as `userStore` (push to an array, expose a `reset()` for
tests) — there is no SMTP config in `.env`, so nothing external is wired up; ACs only
require that dispatch is triggered and observable, not that a real email is delivered.
"Access is denied / granted" is expressed purely via HTTP status + message on a new
`POST /api/login` endpoint — no session/JWT/cookie mechanism is built, since no AC or
existing code introduces one.

## File layout
```
src/utils/password.js          # new: hashPassword(password), verifyPassword(password, stored)
src/services/mailer.js         # new: sendVerificationEmail(email, token), getSentEmails(), reset()
src/routes/registration.js     # modify: unverified creation, dispatch, resend-on-duplicate-unverified, reject-on-duplicate-verified
src/routes/login.js            # new: POST /api/login — deny unverified, succeed if verified
src/routes/verification.js     # new: GET /api/verify/:token — marks account verified
src/store/userStore.js         # modify: add findByVerificationToken(token)
src/app.js                     # modify: mount login + verification routers
tests/registration.test.js     # modify: AC1 block asserts unverified+dispatch; duplicate block split into 019 AC2/AC3
tests/verification.test.js     # new: AC6
tests/login.test.js            # new: AC4 (+ supports AC6's "granted access")
```

## Data model change
`userStore` records gain: `passwordHash` (was previously not stored at all — password
was accepted but discarded), `verified: boolean`, `verificationToken: string|null`.

## TDD build order

### Step 1 — AC1: valid sign-up creates an unverified account and dispatches a verification email
- **Failing test first** (`tests/registration.test.js`, extend the existing
  `AC1: successful registration` describe): POST `/api/register` with a valid payload;
  assert `201` and the existing response shape, plus: `userStore.findByEmail(email).verified === false`,
  and `mailer.getSentEmails()` has exactly one entry with `to === email` and a defined `token`.
  Add `mailer.reset()` alongside the existing `userStore.reset()` in `beforeEach`.
- **Minimal code to pass:**
  - `src/utils/password.js`: `hashPassword(password)` (scrypt with random salt, returns
    `"salt:hash"` hex string) and `verifyPassword(password, stored)` (constant-time compare).
  - `src/services/mailer.js`: in-memory `sentEmails` array; `sendVerificationEmail(email, token)`
    pushes `{ to: email, token, sentAt }`; `getSentEmails()`; `reset()`.
  - `src/routes/registration.js`: on the happy path, hash the password, generate
    `verificationToken = crypto.randomUUID()`, set `verified: false`, save, call
    `mailer.sendVerificationEmail(user.email, verificationToken)`, and respond `201` with
    a message telling the user to check their email (excluding `passwordHash`/`verificationToken`
    from the response body).
- **Files:** create `src/utils/password.js`, `src/services/mailer.js`; modify
  `src/routes/registration.js`, `tests/registration.test.js`.

### Step 2 — AC5: invalid email/password shows inline errors and nothing is submitted
- **Failing test first** (`tests/registration.test.js`, new test in the existing weak-password
  describe): POST with an invalid password (already asserted to return `400`); additionally
  assert `userStore.findByEmail(email)` is `undefined` and `mailer.getSentEmails()` is empty —
  i.e. no account created and no email dispatched on a failed validation.
- **Minimal code to pass:** none — the existing validator already runs before any store/mailer
  interaction; this step only adds the "no side effects" assertion. If it fails, the fix is
  ensuring `registration.js` returns before touching `userStore`/`mailer` (it already does).
- **Files:** modify `tests/registration.test.js` only.

### Step 3 — AC3: duplicate email, unverified → resend verification email
- **Failing test first** (`tests/registration.test.js`, replace the old
  `AC2: duplicate email rejected` describe with `MT-STORY-019 AC3: duplicate unverified email`):
  register a payload once (leaving it unverified, the default), then POST the same email again
  (case-variant, matching the existing case-insensitivity check); assert `200`, a response
  message matching `/check your inbox/i`, `mailer.getSentEmails()` now has length 2 (both to
  the same address, second with a fresh token), and `userStore` still has exactly one record
  for that email (no duplicate account).
- **Minimal code to pass:** in `src/routes/registration.js`, before creating a new user, look up
  `userStore.findByEmail`. If found and `!existing.verified`: generate a new
  `verificationToken`, save it on the existing record, call
  `mailer.sendVerificationEmail`, and respond `200` with the "check your inbox" message.
- **Files:** modify `src/routes/registration.js`, `tests/registration.test.js`.

### Step 4 — AC2: duplicate email, already verified → rejected with log-in/recovery nudge
- **Failing test first** (`tests/registration.test.js`, new describe
  `MT-STORY-019 AC2: duplicate verified email`): register a payload, then manually mark that
  user verified via the store (`const u = userStore.findByEmail(email); u.verified = true; userStore.save(u);`)
  to set up the precondition without depending on the not-yet-built verify endpoint. POST the
  same email again; assert `409` and a message matching `/already registered/i` (or similar)
  that mentions logging in or recovering the password.
- **Minimal code to pass:** in `registration.js`, in the duplicate branch, add the `existing.verified`
  case ahead of the unverified one: respond `409` with
  `"This email is already registered. Please log in or reset your password."`.
- **Files:** modify `src/routes/registration.js`, `tests/registration.test.js`.

### Step 5 — AC6: clicking the verification link verifies the account
- **Failing test first** (`tests/verification.test.js`, new file): register a payload, read the
  token off `mailer.getSentEmails()[0].token`, `GET /api/verify/:token`; assert `200` and a
  message matching `/verified/i`, and that `userStore.findByEmail(email).verified === true`.
  Add a second test: `GET /api/verify/not-a-real-token` → `400` with an "invalid or expired"
  style error, and no user is mutated.
- **Minimal code to pass:** `src/store/userStore.js`: add `findByVerificationToken(token)`
  (linear scan over `users.values()`). `src/routes/verification.js`: `GET /verify/:token` looks
  the user up; if not found, `400`; otherwise set `verified = true`, `verificationToken = null`,
  save, respond `200`. Mount the router in `src/app.js`.
- **Files:** create `src/routes/verification.js`, `tests/verification.test.js`; modify
  `src/store/userStore.js`, `src/app.js`.

### Step 6 — AC4: logging in before verifying is denied (and succeeds once verified)
- **Failing test first** (`tests/login.test.js`, new file):
  1. Register a payload (left unverified). `POST /api/login` with the same email/password;
     assert `403` and a message matching `/verify your email/i` (or `/check your inbox/i`).
  2. Extend the same flow: verify via `GET /api/verify/:token` (token from the mailer outbox),
     then `POST /api/login` again with the same credentials; assert `200` and a success message —
     this is the concrete, testable form of AC6's "the user is granted access".
- **Minimal code to pass:** `src/routes/login.js`: `POST /login` requires `email`+`password`;
  look up the user and `verifyPassword` against `passwordHash` — if missing/mismatched, `401`
  "Invalid email or password" (minimal necessary behavior for the endpoint to be meaningful,
  not separately tested since it's not an AC); if found and matched but `!verified`, `403` with
  the check-your-inbox message; if verified, `200` "Login successful". Mount the router in
  `src/app.js`.
- **Files:** create `src/routes/login.js`, `tests/login.test.js`; modify `src/app.js`.

## Test hygiene
- Every test file calls `userStore.reset()` and `mailer.reset()` in `beforeEach` for isolation.
- Describe blocks are labeled by this story's AC number (`MT-STORY-019 AC1`..`AC6`) except
  where they extend an existing AC1 block from the prior story; the retained 013-era describes
  (required-field checks, email-format, password-strength) are left as-is since they still
  satisfy this story's AC5.

## Out of scope (explicitly not built, per "stay within ACs")
- No password-reset flow — AC2 only requires the nudge message, not a working "forgot password" feature.
- No session/JWT/cookie-based auth — "access denied/granted" is expressed via login endpoint status codes and messages only.
- No verification-token expiry/rate-limiting on resend — not specified by any AC.
- No real email delivery/SMTP integration — dispatch is modeled as an observable in-memory outbox.
- No changes to the existing `name`/`dateOfBirth` required fields or their validation.
