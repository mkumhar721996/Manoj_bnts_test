# MT-STORY-024 — Manoj_demo (Facebook-style website)

## Design source
Read in full: `.arc/designs/MT-STORY-024-design.html`. It is a single-file prototype with a
"reviewer bar" scaffold (Prev/Next/screen picker — a review-only tool, not part of the
shipped product) and 5 screens toggled by JS (`.screen-panel`/`.is-active`):

1. **`data-screen="home"`** — signed-out homepage: `.site-header` (brand-wordmark "Facebook",
   "Log In"/"Create Account" buttons) + `.hero` with `.hero-copy` (lowercase "facebook"
   wordmark + tagline paragraph) and two `.card`s: a **login card** ("Log Into Your Account":
   email + password fields, "Log In" button, "Forgotten password?" helper link) and a
   **registration card** ("Create a New Account": full name, email address, "New password"
   fields, "Sign Up" button). Covers AC1 + AC2.
2. **`data-screen="reg-error"`** — `.status-screen` with `.alert-danger` ("We couldn't create
   your account." + `<ul>` of per-field messages), the same 3-field form again, "Try Again"
   button, back link. Covers AC4.
3. **`data-screen="reg-success"`** — `.status-icon.success` + `.alert-success` ("Account
   created for `<name>`. A confirmation has been sent to `<email>`.") + "Continue to Log In"
   button. Covers AC3.
4. **`data-screen="login-error"`** — `.status-icon.danger` + `.alert-danger` ("The email or
   password you entered is incorrect. Access denied.") + login form again, "Try Again" button.
   Covers AC6.
5. **`data-screen="feed"`** — `.app-shell` (side-nav, welcome banner "Welcome back, `<First>`!",
   3 static posts, right-rail contacts list), avatar with initial, "Log Out" button. Covers AC5.

All colours/spacing/typography come from the `:root` custom properties (`--brand: #1877f2`,
`--bg: #f0f2f5`, spacing scale `--space-1..8`, `--radius-*`, `--font-size-*`, etc.) — these
become this project's design tokens.

**Explicitly excluded from the shipped product** (prototype-only affordances, not real UI):
the `.reviewer-bar` and its JS, the `.screen-panel`/`.is-active` show/hide mechanism, the
`.fixture-hint` boxes (dev instructions like "Try it: jordan@example.com / Passw0rd!..."), and
the inline `existingUsers` fixture array / `setTimeout`-simulated network calls.

## Conflict between the approved design/ACs and already-shipped, tested backend code — flagging, not silently resolving
This repo already has a working registration/login/verification slice from two earlier stories
(MT-STORY-019, MT-STORY-020), covered by `tests/registration.test.js`, `tests/login.test.js`,
`tests/verification.test.js`, which I re-read in full. Two of its rules conflict with what this
story's design and ACs show:

1. **`dateOfBirth`**. `src/validation/registrationValidator.js` requires `name`, `email`,
   `password`, **and `dateOfBirth`** (`registrationValidator.js:1`), and
   `tests/registration.test.js`'s `AC3: required field missing` block asserts all four are
   mandatory on `POST /api/register`. The approved design's registration form (screens 1 & 2)
   has only 3 fields — no date-of-birth input anywhere — matching this story's AC2 verbatim
   ("fields for name, email, and password"). I cannot add an undesigned field to the UI (the
   design is approved and final), and I won't loosen the existing `/api/register` contract or
   touch its passing tests, since that endpoint/behaviour was accepted under MT-STORY-019 and
   is out of scope here.
2. **Email verification gate on login**. `src/routes/login.js` (`POST /api/login`) returns
   `403` for a correct-but-unverified account, and `src/middleware/requireVerifiedUser.js`
   enforces the same on `/api/account` — both established and tested under MT-STORY-020. The
   design's login flow has no verification step at all: screen 3's success copy says "You can
   now log in with your new account" immediately, and the login card matches straight against
   `existingUsers` with no `verified` concept. AC5/AC6 as written also say nothing about
   verification — just "valid credentials → feed" / "invalid credentials → error".

**Resolution taken for this plan** (flagging for reviewer sign-off rather than deciding
silently): build the website as its **own route surface**, separate from the existing
`/api/register` / `/api/login` JSON API, with its own minimal validator that only requires the
3 fields the design/AC2 show, and its own login check that does not gate on `verified`. This
satisfies AC1–AC6 and the approved design exactly, without touching or weakening the existing
`/api/*` endpoints or breaking their tests (those stay serving whatever other consumer needs
`dateOfBirth`+verification). Users created through the website are stored in the same
`userStore` (so emails stay globally unique) but with `verified: true` set immediately, so the
two login paths (`/api/login` vs. the new website login) simply apply different rules to the
same store. **If this dual-contract approach is not acceptable, please say so in review** —
the alternative would be to change the shared registration contract itself (drop the
`dateOfBirth` requirement / verification gate project-wide), which would need to update the
now-passing MT-STORY-019/020 tests and is a bigger, cross-cutting change.

A third, smaller mismatch: the design's client-side password rule is "at least 8 characters"
only (placeholder text, fixture-hint copy), whereas `registrationValidator.js` additionally
requires a letter and a digit. The new website validator follows the **design's** simpler rule
(length only), since AC4 doesn't specify complexity and the design is the literal source of
truth for what the form validates.

## Architecture for the new website
- No template engine or new dependency is added; pages are plain HTML strings assembled by
  small view functions (consistent with the project's current "no framework beyond Express"
  footprint).
- `src/views/layout.js` — `renderLayout(title, bodyHtml)`: wraps content in
  `<!DOCTYPE html>`/`<head>` with a `<style>` block that is the design's CSS **verbatim**
  (`:root` tokens + `.site-header`, `.brand-wordmark`, `.header-actions`, `.btn*`, `.hero*`,
  `.card`, `.field*`, `.divider`, `.helper-text`, `.alert*`, `.status-screen`, `.status-icon*`,
  `.app-shell`, `.side-nav*`, `.avatar`, `.welcome-banner`, `.post*`, `.right-rail*`,
  `.contact`, `.back-link`), minus `.reviewer-bar*`, `.screen-panel`/`.is-active`, and
  `.fixture-hint` (prototype-only, see above).
- `src/views/pages/homePage.js`, `registrationErrorPage.js`, `registrationSuccessPage.js`,
  `loginErrorPage.js`, `feedPage.js` — one file per screen, each returning the markup
  described in "Design source" above via `renderLayout`.
- `src/utils/escapeHtml.js` — new. Every place a page interpolates user-supplied data (name,
  email) into HTML must escape it; this doesn't exist yet because prior code only ever returned
  JSON. Needed to avoid a stored/reflected XSS via the name field.
- `src/validation/webRegistrationValidator.js` — new, returns an **array** of all failing
  messages (not just the first), matching the design's `errors.push(...)` pattern and screen
  2's `<ul>` of multiple `<li>`s, and satisfying AC4's "indicating which fields are invalid".
- `src/routes/web.js` — new router: `GET /`, `POST /register`, `POST /login`, mounted at the
  app root (not under `/api`) in `src/app.js`, alongside the existing routers.
- `src/app.js` also needs `express.urlencoded({ extended: false })` added (currently only
  `express.json()` is registered), since the design's forms are plain `<form method="post">`
  submissions, not `fetch`/JSON.
- Header nav links / "Try Again" / "Continue to Log In" / "Log Out" / back-links become plain
  `<a href="/">` or `<a href="#registerCard">`-style anchors (the design's `onclick="showScreen(...)"` and `.focus()` calls are prototype-only JS for the single-page reviewer demo and are replaced by real navigation, since this is now a real multi-page app).
- **Scoping note**: there's no persistent session/cookie carrying the logged-in state across a
  page reload — the feed page is rendered directly as the response to a successful
  `POST /login`, which is sufficient for AC5 ("authenticated and redirected to their feed"),
  but visiting the site again afterwards starts signed-out. No AC asks for persistent
  cross-request auth, so this isn't built (matches the "Out of scope" pattern used in the prior
  MT-STORY-019 plan for this same codebase).
- **Duplicate email**: if a website registration reuses an email already in `userStore`,
  the current write would silently overwrite the existing account. No AC mentions this, but
  silently allowing one user to overwrite another's account is a data-integrity/security bug,
  not a speculative feature, so it's handled minimally: treated as one more validation error
  ("This email is already registered.") rendered on the same screen-2 error UI, tested under
  AC4.

## TDD task breakdown

### AC1 — Facebook-branded homepage on load
- **Failing test first** (`tests/web.test.js`, new file): `GET /` → `200`,
  `Content-Type` is HTML, body contains the `site-header` brand-wordmark "Facebook", the hero's
  lowercase "facebook" wordmark, and the tagline "Connect with friends and the world around
  you on Facebook.".
- **Minimal code**: `src/views/layout.js`, `src/views/pages/homePage.js` (header + hero only,
  no cards yet — cards land in the AC2 step so each test drives only the markup it needs),
  `src/routes/web.js` with `GET '/'`, mount in `src/app.js`.
- **Files**: create `src/views/layout.js`, `src/views/pages/homePage.js`, `src/routes/web.js`,
  `tests/web.test.js`; modify `src/app.js`.

### AC2 — registration form visible with name, email, password fields
- **Failing test first** (`tests/web.test.js`): extend the `GET /` assertions — body contains
  a `<form ... action="/register">` with a text input `name="name"`, a text input
  `name="email"`, a password input `name="password"`, and a "Sign Up" submit button; also
  assert the login card's email/password fields and "Log In" button are present (needed later
  by AC5/AC6 but visible now).
- **Minimal code**: fill in `homePage.js`'s login card and registration card markup exactly as
  described in "Design source" screen 1 (labels, placeholders, button classes/labels).
- **Files**: modify `src/views/pages/homePage.js`, `tests/web.test.js`.

### AC3 — valid registration creates the account and shows confirmation
- **Failing test first** (`tests/web.test.js`, `userStore.reset()` in `beforeEach`, importing
  `userStore` like the existing API tests do): `POST /register` with valid
  `{ name: 'Priya Shah', email: 'priya@example.com', password: 'longenough' }` → `201`,
  HTML body contains the success icon, `Account created for Priya Shah.`, `A confirmation has
  been sent to priya@example.com.`, and "Continue to Log In"; also assert
  `userStore.findByEmail('priya@example.com')` exists with `verified === true` and a
  `passwordHash` (not the raw password).
- **Minimal code**: `src/validation/webRegistrationValidator.js` (happy path), `src/utils/escapeHtml.js`, `src/views/pages/registrationSuccessPage.js`, `POST /register` handler in
  `src/routes/web.js` (hash password via existing `src/utils/password.js#hashPassword`, save
  user with `verified: true`, render success page).
- **Files**: create `src/validation/webRegistrationValidator.js`, `src/utils/escapeHtml.js`,
  `src/views/pages/registrationSuccessPage.js`; modify `src/routes/web.js`, `tests/web.test.js`.

### AC4 — missing/invalid registration fields show which fields are invalid
- **Failing test first** (`tests/web.test.js`), several cases: (a) missing `name` only → `400`,
  body contains "Name is required." in the error `<ul>`; (b) invalid email (`no-at-sign`) →
  body contains "Email address is not valid."; (c) password under 8 chars → body contains
  "Password must be at least 8 characters."; (d) all three blank at once → body contains all
  three messages together in one response; (e) re-registering an email that already exists →
  `400`, body contains "This email is already registered."; each case also asserts
  `userStore.findByEmail(...)` stays absent (or unchanged for case (e)).
- **Minimal code**: `webRegistrationValidator.js` collects all failing messages into an array
  (not early-return), plus the duplicate-email check in the route handler;
  `src/views/pages/registrationErrorPage.js` rendering the `<ul>` of messages + the 3-field
  form again + "Try Again" + back link; `POST /register` renders it with `400` when
  `errors.length > 0`.
- **Files**: create `src/views/pages/registrationErrorPage.js`; modify
  `src/validation/webRegistrationValidator.js`, `src/routes/web.js`, `tests/web.test.js`.

### AC5 — valid login credentials authenticate and redirect to feed/dashboard
- **Failing test first** (`tests/web.test.js`): seed a user (via `userStore.save` with a
  pre-hashed password and `verified: true`, or by first `POST /register`-ing), then
  `POST /login` with matching email/password → `200`, HTML body contains the `app-shell`,
  "Welcome back, `<FirstName>`!", the avatar with the first-letter initial, and the 3 static
  posts (Aisha Khan / Diego Fernandez / Lin Wei) and 4 contacts from the design's feed screen.
- **Minimal code**: `src/views/pages/feedPage.js` (static post/contact content baked in exactly
  as in the design, dynamic welcome name/avatar from the logged-in user); `POST /login` handler
  in `src/routes/web.js` looks up the user, verifies the password with the existing
  `verifyPassword` util, and renders `feedPage` on match.
- **Files**: create `src/views/pages/feedPage.js`; modify `src/routes/web.js`,
  `tests/web.test.js`.

### AC6 — invalid login credentials show an error and deny access
- **Failing test first** (`tests/web.test.js`): (a) `POST /login` with a wrong password for an
  existing user → `401`, body contains the danger icon and "The email or password you entered
  is incorrect. Access denied." and the login form again with "Try Again"; (b) same assertions
  for a `POST /login` with an email that doesn't exist at all.
- **Minimal code**: `src/views/pages/loginErrorPage.js`; in the `POST /login` handler, mirror
  the existing `src/routes/login.js` pattern of comparing against a `DUMMY_HASH` when no user is
  found (so a nonexistent email takes the same code path/cost as a wrong password, consistent
  with the timing-safety already established for `/api/login`), returning `401` + the error
  page whenever the user is missing or the password doesn't match.
- **Files**: create `src/views/pages/loginErrorPage.js`; modify `src/routes/web.js`,
  `tests/web.test.js`.

## Out of scope (explicitly not built, per "stay within ACs")
- No changes to `/api/register`, `/api/login`, `/api/verify-email`, `/api/resend-verification`,
  `/api/account`, or their tests — the conflict above is resolved by adding a parallel, simpler
  website surface, not by touching the existing contract.
- No password-reset flow — the "Forgotten password?" link is rendered per the design but is
  inert (`href="#"`), same as the prototype.
- No persistent session/cookie/logout mechanism beyond the single post-login response (see
  scoping note above) — no AC requires surviving a page reload.
- No client-side JS/validation — forms are plain HTML `method="post"` submissions; all
  validation is server-side, consistent with there being no JS shipped elsewhere in this app.
- The reviewer bar, `.screen-panel` JS, and `.fixture-hint` boxes from the prototype are not
  shipped (review-only tooling, not part of the approved visual design of the product itself).
