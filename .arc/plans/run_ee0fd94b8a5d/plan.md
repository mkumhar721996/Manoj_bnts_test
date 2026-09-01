# MT-STORY-055 — Protected Game Route (GET /game)

## Context / assumptions

This repo is the server-rendered "Facebook"-style app from prior stories (MT-STORY-013/019/020/024/052).
Two parallel auth surfaces already exist:

- **`/api/*` JSON API** (`src/routes/login.js`, `src/routes/registration.js`,
  `src/middleware/requireVerifiedUser.js`): issues a `sessionToken` string from
  `sessionStore.create(userId)`, checked via `Authorization: Bearer <token>` and gated on
  `user.verified`.
- **Website surface** (`src/routes/web.js`, mounted at `/`): `POST /login` currently checks
  credentials and renders `feedPage` directly — it does **not** call `sessionStore.create`, set
  any cookie, or persist a session at all. This was an explicit, documented scoping decision in
  the MT-STORY-024 plan ("no persistent session/cookie/logout mechanism... no AC requires
  surviving a page reload"), which was true for that story but is no longer true for this one:
  AC2/AC5/AC6/AC8 all require a session that survives across separate `GET /game` requests.

**Decision (extends web login, flagging it explicitly):** `POST /login` in `web.js` will be
changed to call `sessionStore.create(user.id)` and set the token as an HTTP-only cookie on the
response, so a browser page load of `GET /game` can carry it automatically. This is the minimal
change that makes AC2/AC5/AC6/AC8 testable through the actual page-navigation flow the ACs
describe ("redirect to `/`", "served without prompting for credentials") rather than inventing a
header-based stand-in. `requireVerifiedUser` / `/api/account` / `/api/login` are untouched — they
keep using `sessionStore.findUserId`, whose existing behavior/contract is preserved exactly (see
below), so MT-STORY-019/020's passing tests are not at risk.

**No cookie-parser dependency is added.** `res.cookie(...)` for *setting* the cookie is part of
Express core (no new package). For *reading* it back, a small manual parser
(`src/utils/cookies.js`) is added instead of pulling in `cookie-parser` — consistent with this
repo's pattern of tiny hand-rolled utils (`escapeHtml.js`) rather than new dependencies.

**Session model change:** `sessionStore` currently stores only `token -> userId`. This story adds
two lifecycle concerns per AC1–AC8:
- **Absolute expiry** (AC3/AC6) — no AC specifies a duration, so (mirroring
  `verificationTokenStore`'s existing `DEFAULT_TTL_MS` + test-only `expire()` pattern) a generous
  default TTL (24h) is used, with a test-only `expire(token)` helper to force expiry
  deterministically instead of waiting out a real TTL.
- **Idle timeout** (AC4/AC5/AC8) — a fixed 10-minute idle window, tracked via `lastActiveAt`,
  updated only by a successful `GET /game` hit (per AC5's specific wording: "idle **on the game
  route**"), not by every request in the app.

`sessionStore.findUserId(token)` — the function `requireVerifiedUser` already depends on — keeps
its exact current behavior (plain lookup, no expiry/idle check), so this change is additive and
does not alter `/api/account`'s behavior or MT-STORY-019/020 scope.

**Simulating time in tests:** tests stub `Date.now()` via `jest.spyOn(Date, 'now')` (not
`jest.useFakeTimers()`), so the idle-window math is controllable without interfering with
Supertest/Node's real timers and sockets.

**Simulating "no design exists for this page":** there is no design file for MT-STORY-055 (only
MT-STORY-024/030 designs exist under `.arc/designs/`). No AC describes slot-machine gameplay, only
that "the game page is/is not rendered" — so `gamePage.js` is a minimal placeholder view with one
identifiable marker (`id="slot-machine"`), following the same "no design, minimal placeholder"
approach `expensesPage.js` used in MT-STORY-052. Gameplay mechanics are explicitly out of scope.

**AC7 (no verification gate) is satisfied by construction**, not a special case: the new
`requireGameSession` middleware only ever consults `sessionStore`, never `user.verified` — it
doesn't even look up the `userStore`. The test for AC7 is a regression check on that design
choice, not new production code.

**AC6 (fail-closed on restart)** is exercised by calling the existing `sessionStore.reset()` in a
test — this already wipes the in-memory `Map`, which is a faithful simulation of "the server
restarted, wiping all in-memory sessions."

## File layout

```
src/utils/cookies.js                 # new: parseCookies(header) -> plain object
src/store/sessionStore.js            # modify: richer records {userId, expiresAt, lastActiveAt},
                                      #   add isActive(token), touch(token), expire(token) test helper
src/middleware/requireGameSession.js # new: reads cookie, checks sessionStore.isActive, touches, else redirect
src/views/pages/gamePage.js          # new: renderGamePage() — minimal slot-machine placeholder markup
src/routes/web.js                    # modify: POST /login issues+cookies a session; add GET /game
tests/game.test.js                   # new: one describe block per AC
```

No changes to `src/app.js` (`web.js` already mounted at `/`), `src/middleware/requireVerifiedUser.js`,
`src/routes/login.js`, `src/routes/registration.js`, or any `/api/*` test file.

## Data model change

`sessionStore` record becomes `{ userId, expiresAt, lastActiveAt }` (was a bare `userId` value).

```js
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;   // no AC specifies a value; generous default
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;       // AC4/AC8's "10 minutes"

create(userId)      // unchanged signature/return (token string); now also sets expiresAt/lastActiveAt
findUserId(token)    // unchanged behavior: plain lookup, no expiry/idle check (requireVerifiedUser relies on this)
isActive(token)      // new: token exists AND now <= expiresAt AND (now - lastActiveAt) <= IDLE_TIMEOUT_MS
touch(token)         // new: sets lastActiveAt = Date.now() on an existing record
expire(token)        // new, test-only: forces expiresAt into the past (mirrors verificationTokenStore.expire)
reset()              // unchanged
```

## TDD build order

### Step 1 — AC1: no session token → redirected to `/`, game page not rendered
- **Failing test first** (`tests/game.test.js`, new file): `GET /game` with no cookie at all →
  expect a redirect status (`302`) with `Location: /`, and assert the response body does **not**
  contain the slot-machine marker (`id="slot-machine"`).
- **Minimal code to pass:**
  - `src/utils/cookies.js`: `parseCookies(header)` — splits on `;`, trims, `decodeURIComponent`s
    values, returns `{}` for a missing/non-string header.
  - `src/views/pages/gamePage.js`: `renderGamePage()` returning `renderLayout('Facebook', body)`
    with a body containing `<div id="slot-machine">` and a heading, per the "no design" note above.
  - `src/middleware/requireGameSession.js`: reads `parseCookies(req.headers.cookie)`, looks up the
    `sessionToken` cookie; if missing or falsy, `res.redirect('/')`; otherwise `next()` (idle/expiry
    checks land in Step 4/5 below — at this step any present token is treated as valid, since no
    test yet proves otherwise).
  - `src/routes/web.js`: `router.get('/game', requireGameSession, (req, res) => res.type('html').send(renderGamePage()));`
- **Files:** create `src/utils/cookies.js`, `src/middleware/requireGameSession.js`,
  `src/views/pages/gamePage.js`, `tests/game.test.js`; modify `src/routes/web.js`.

### Step 2 — AC2: valid, active session → slot-machine page served, no credential prompt
- **Failing test first:** using a Supertest `agent` (persists cookies across requests, modeling a
  real browser): register a user via `POST /register`, then `POST /login` with the same
  credentials, then `agent.get('/game')`; expect `200`, `Content-Type` HTML, body contains
  `id="slot-machine"`, and — critically — the response is not a redirect and does not contain the
  homepage's login form markup (`action="/login"`), proving no re-authentication prompt occurred.
- **Minimal code to pass:** in `src/routes/web.js`'s `POST /login` success branch, add
  `const sessionToken = sessionStore.create(user.id); res.cookie('sessionToken', sessionToken, { httpOnly: true });`
  before rendering `feedPage` (require `sessionStore` at the top of `web.js`).
- **Files:** modify `src/routes/web.js`, `tests/game.test.js`.

### Step 3 — AC6: server restart (session wipe) fails closed
- **Failing test first:** register + login via the `agent` (as above) to obtain a working
  `/game` session, confirm `agent.get('/game')` is `200`; then call `sessionStore.reset()` directly
  (simulating the in-memory store being wiped by a restart) and repeat `agent.get('/game')` with
  the *same* cookie the agent already holds; expect a redirect to `/`, not `200`.
- **Minimal code to pass:** none — `requireGameSession`'s `sessionStore` lookup already returns
  nothing for a token no longer in the (reset) `Map`, so this step is a pure regression test over
  Steps 1–2's code, proving the "fail closed" property holds without any special-casing.
- **Files:** modify `tests/game.test.js` only.

### Step 4 — AC3: expired session token → redirected to `/`
- **Failing test first:** register + login via the `agent`; extract the raw token value from the
  login response's `Set-Cookie` header (small test helper, regex `/sessionToken=([^;]+)/`); call
  `sessionStore.expire(token)`; then `agent.get('/game')` → expect redirect to `/`.
- **Minimal code to pass:** in `sessionStore.js`, add `expiresAt: Date.now() + SESSION_TTL_MS` to
  the record created by `create()`, add `isActive(token)` (checks existence + `expiresAt >= Date.now()`
  — idle check added in Step 5) and `expire(token)` (sets `expiresAt` into the past, same pattern as
  `verificationTokenStore.expire`); change `requireGameSession` to call `sessionStore.isActive(token)`
  instead of a bare existence check.
- **Files:** modify `src/store/sessionStore.js`, `src/middleware/requireGameSession.js`,
  `tests/game.test.js`.

### Step 5 — AC4 + AC8 + AC5: idle timeout, its 9:59 boundary, and resetting on activity
- **Failing tests first:**
  - *AC4:* login via the `agent`; stub `Date.now()` (via a mutable `now` variable + `jest.spyOn`)
    to jump forward by 10 minutes + 1 second past the last `/game` hit (login counts as the first
    "activity"); `agent.get('/game')` → expect redirect to `/`.
  - *AC8:* same setup, jump forward by exactly 9 minutes 59 seconds instead; `agent.get('/game')`
    → expect `200` with `id="slot-machine"`.
  - *AC5:* login via the `agent`; advance 9 minutes; `agent.get('/game')` → expect `200` (this hit
    must reset the idle clock); advance **another** 9 minutes 59 seconds (i.e. ~19 minutes since
    login, but under 10 minutes since that last hit) and `agent.get('/game')` again → expect `200`.
    This is the test that specifically fails if the idle window were measured from login/creation
    time instead of from the most recent `/game` hit.
- **Minimal code to pass:** in `sessionStore.js`, add `lastActiveAt: Date.now()` to `create()`'s
  record; add `touch(token)` (sets `lastActiveAt = Date.now()`); extend `isActive(token)` to also
  require `Date.now() - record.lastActiveAt <= IDLE_TIMEOUT_MS` (`IDLE_TIMEOUT_MS = 10 * 60 * 1000`;
  "more than 10 minutes" per AC4 means the check is `<=`, not `<`, so exactly-9:59 in AC8 passes and
  exactly 10:00+ fails). In `requireGameSession`, call `sessionStore.touch(token)` immediately after
  a successful `isActive` check, before `next()`, so the current request itself extends the window
  (AC5).
- **Files:** modify `src/store/sessionStore.js`, `src/middleware/requireGameSession.js`,
  `tests/game.test.js`.

### Step 6 — AC7: unverified email does not block `/game`
- **Failing test first:** register a user via `POST /register` (created `verified: false` per the
  existing website registration flow — confirm via `userStore.findByEmail(email).verified === false`
  before proceeding, so the test is provably exercising the unverified case), log in via the
  `agent`, then `agent.get('/game')` → expect `200` with `id="slot-machine"` (not a 403 or redirect).
- **Minimal code to pass:** none — `requireGameSession` never reads `user.verified` (it never even
  looks up `userStore`), so this is a pure regression/confirmation test over the existing code.
- **Files:** modify `tests/game.test.js` only.

## Test hygiene
- `tests/game.test.js` calls `userStore.reset()`, `sessionStore.reset()`, and `emailService.reset()`
  in `beforeEach`.
- Each `describe` block is labeled by AC number (`AC1`..`AC8`), matching the convention in
  `tests/web.test.js`/`tests/verification.test.js`.
- A local helper builds a valid web-registration payload (name/email/password only, matching
  `webRegistrationValidator`'s 3-field contract, not the `/api/register` 4-field one) and another
  extracts the raw session token from a `Set-Cookie` response header for the direct
  `sessionStore.expire()`/`reset()` manipulations in Steps 3–4.
- Time-based tests (Step 5) restore the real `Date.now` (`jest.restoreAllMocks()` or equivalent) in
  an `afterEach` so stubbed time never leaks into other tests in the file.

## Out of scope (explicitly not built, per "stay within ACs")
- No slot-machine gameplay (spinning, payouts, RNG) — no AC describes game mechanics, only that the
  page is/isn't served.
- No changes to `/api/login`, `/api/register`, `/api/account`, `requireVerifiedUser`, or their
  tests — this story only extends the website's `POST /login` and adds `GET /game`.
- No logout endpoint or manual session invalidation — no AC requires it.
- No `cookie-parser`/session-management npm dependency — hand-rolled parsing, per the existing
  "no new dependency unless needed" pattern in this repo.
- No idle-timeout tracking on any other website route (`/`, `/cart`, `/checkout`, `/expenses`,
  etc.) — AC5 scopes the idle-reset behavior specifically to `GET /game`.
- No UI countdown/warning before the idle timeout fires — not required by any AC.
