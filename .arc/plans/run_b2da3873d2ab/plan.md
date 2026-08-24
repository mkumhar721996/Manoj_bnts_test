# MT-STORY-013 — User registration ("Facebook" sign-up)

## Context / assumptions
The repository is currently empty (only `README.md` and `.env`) — there is no existing
application code, framework, or test setup to conform to. This plan therefore scaffolds a
minimal, from-scratch implementation sized to exactly the 5 acceptance criteria: a
registration API endpoint with validation and a confirmation response. No UI is implied by
the ACs beyond "the user is shown a confirmation" / "an error message is displayed", both of
which are satisfied by the HTTP response body — no frontend is built.

**Stack choice:** Node.js + Express (HTTP layer) with an in-memory user store, tested with
Jest + Supertest. This is chosen for minimal setup overhead and because no persistence,
auth, or frontend requirement is stated in the ACs. `.env` already reserves
`ARC_DEV_PORT=8013` for this service.

## File layout to be created
```
package.json
src/app.js                        # Express app (exported, no listen) — used directly by supertest
src/server.js                     # entry point: app.listen(process.env.ARC_DEV_PORT)
src/store/userStore.js            # in-memory Map keyed by lowercased email + reset() helper for tests
src/validation/registrationValidator.js   # pure function: validate(payload) -> { valid, field, message }
src/routes/registration.js        # POST /api/register route wiring validator + store
tests/registration.test.js        # supertest tests, one describe block per AC
```

## Validation rules (minimal, only what ACs require)
- Required fields: `name`, `email`, `password`, `dateOfBirth`. Missing/empty any one →
  reject, error identifies the missing field (AC3).
- Email format: simple RFC-5322-lite regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) → reject with
  "invalid email format" message if it fails (AC4).
- Password requirements: minimum 8 characters, at least one letter and one digit → reject
  with a message stating the requirements if it fails (AC5).
- Duplicate email: case-insensitive match against existing store entries → reject with
  "email already in use" message (AC2).
- Happy path: all fields present, valid, email not already registered → create account,
  return success confirmation (AC1).

Order of checks in the implementation: required-fields → email format → password
requirements → duplicate email → create. This order matches the TDD build sequence below.

## TDD build order

### Step 0 — scaffolding (no AC on its own, needed before any test can run)
- Create `package.json` with `express`, `jest`, `supertest` (devDependency) and a `test`
  script (`jest`).
- Create `src/app.js` exporting a bare Express app with `express.json()` middleware and no
  routes yet, and `src/store/userStore.js` exporting an empty `Map` plus a `reset()` function.
- No test written for this step; it's infrastructure only.

### Step 1 — AC3: required field missing
- **Failing test first** (`tests/registration.test.js`): POST `/api/register` with each of
  `name`, `email`, `password`, `dateOfBirth` omitted in turn; expect `400` and a response
  body whose `error` message names the specific missing field (e.g. `"email is required"`).
  Also assert `404`-shaped failure initially since the route doesn't exist yet — this is the
  first test that forces the route into existence.
- **Minimal code to pass:** `src/validation/registrationValidator.js` with a `REQUIRED_FIELDS`
  check returning `{ valid: false, field, message: `${field} is required` }` for the first
  missing field found; `src/routes/registration.js` wiring `POST /api/register` to call the
  validator and return `400 { error: message }` on failure; mount the router in `src/app.js`.
- **Files:** create `src/validation/registrationValidator.js`, `src/routes/registration.js`;
  modify `src/app.js`.

### Step 2 — AC4: invalid email format
- **Failing test first:** POST with all fields present but `email: "not-an-email"`; expect
  `400` and an error message indicating invalid email format.
- **Minimal code to pass:** add email-regex check to `registrationValidator.js`, run after
  the required-fields check.
- **Files:** modify `src/validation/registrationValidator.js`.

### Step 3 — AC5: password requirements not met
- **Failing test first:** POST with valid name/email/dob but a short/weak password (e.g.
  `"abc"`); expect `400` and an error message stating the password requirements (min 8 chars,
  letter + digit).
- **Minimal code to pass:** add password-strength check to `registrationValidator.js`, run
  after the email-format check.
- **Files:** modify `src/validation/registrationValidator.js`.

### Step 4 — AC1: successful registration
- **Failing test first:** POST with valid name, valid email, valid password (meets rules),
  valid date of birth; expect `201` and a response body confirming success (e.g.
  `{ message: "Registration successful", user: { id, name, email } }`), and assert the
  password is not echoed back in the response.
- **Minimal code to pass:** in `src/routes/registration.js`, after validation passes, create
  a user record (`id` via incrementing counter or `crypto.randomUUID()`), store it in
  `userStore` keyed by lowercased email, and respond `201` with the confirmation payload
  (excluding password).
- **Files:** modify `src/routes/registration.js`, `src/store/userStore.js`.

### Step 5 — AC2: duplicate email rejected
- **Failing test first:** register a user successfully, then POST again with the same email
  (different name/password) and expect `409` with an error message indicating the email is
  already in use. Include a case-variant email (`Test@Example.com` vs `test@example.com`) to
  confirm case-insensitive matching.
- **Minimal code to pass:** in `src/routes/registration.js`, before creating the account,
  check `userStore` for an existing entry with the lowercased email and short-circuit with
  `409 { error: "Email is already in use" }`.
- **Files:** modify `src/routes/registration.js`.

## Test hygiene
- `tests/registration.test.js` calls `userStore.reset()` in a `beforeEach` so tests are
  isolated (needed in particular for Step 5's duplicate-email scenario not leaking into
  other tests).
- Each `describe` block in the test file is labeled with its AC number (`AC1`..`AC5`) for
  traceability back to this plan.

## Out of scope (explicitly not built, per "stay within ACs")
- No persistent database — in-memory store only.
- No password hashing/auth session/login flow — not required by any AC.
- No frontend/UI — ACs are satisfiable via API response content.
- No age/minimum-age-13 or date-of-birth-format validation — no AC specifies rejection
  behavior for an invalid (as opposed to missing) date of birth.
