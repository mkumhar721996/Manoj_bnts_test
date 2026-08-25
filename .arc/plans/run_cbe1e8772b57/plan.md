# MT-STORY-037 — Site navigation & cart indicator

## Codebase fit

This app is a plain Express server rendering HTML via template-literal functions
(`src/views/**`), tested with Jest + Supertest at the HTTP-response level (see
`tests/web.test.js`, `tests/registration.test.js`, etc.). There is no client framework,
no bundler, and (currently) no static-file serving and no browser-automation tool. The
plan below stays inside those conventions: new server-rendered view functions, one small
in-memory store (mirroring `userStore.js`/`sessionStore.js`), one small JSON API router
(mirroring `registration.js`/`login.js` mounted under `/api`), and a small vanilla-JS
file served statically for the one piece of genuinely client-side behavior (AC8).

## Flagged conflict — routing collision at `/` (needs your confirmation)

The approved design's `PrimaryNav` maps `Home → "/"` (component map node `6:13`), i.e. the
Forno Rosso home page is meant to live at the site root. But `/` is already served by
`src/routes/web.js` → `renderHomePage()`, which currently renders an unrelated
Facebook-clone landing page (logo, login form, registration form) built for earlier,
already-shipped stories (013/019/020/024).

I checked the blast radius: `POST /register` and `POST /login` (the web-form endpoints)
are not otherwise exercised from any UI besides that homepage, and the JSON API tests
(`registration.test.js`, `login.test.js`, `verification.test.js`) hit `/api/register`,
`/api/login`, etc. exclusively — they never touch `/` or the web-form routes. So the only
tests affected by changing the homepage are the two `describe` blocks in
`tests/web.test.js` that assert Facebook branding/forms at `GET /` (lines 14–47).

**Assumption I'm building the plan on:** treat this story as the new home page for `/`
per the design, and update (not silently delete) those two `web.test.js` blocks so they
assert the new Forno Rosso header/content instead of the old Facebook copy. The
`POST /register` / `POST /login` routes and their own success/error page tests are left
untouched (they still work when called directly; they just lose their only UI entry
point, which is outside this story's scope to relocate).

If you'd rather keep the legacy homepage at `/` and mount the new site elsewhere, tell me
and I'll change the routes/hrefs accordingly — say so explicitly rather than have me guess.

## Design decisions already settled (treating as fact, not re-litigating)

- **Cart badge zero-state** (`cart-badge-zero-state`, arc-decided): hide the numeric badge
  element when count is 0; render it for any count ≥ 1.
- **Header scroll behavior** (`header-sticky-behavior`, arc-decided): `SiteHeader` is
  sticky/pinned to the top of the viewport while the page scrolls.
- **Nav "Cart" link vs. cart indicator** (non-blocking): both the `PrimaryNav` "Cart" text
  link and the `CartIndicatorButton` route to the same `/cart` destination.
- **Delivery ETA / cart count are data, not literals** (non-blocking): `DeliveryEtaLabel`
  and the cart badge are rendered from props/store values, never hardcoded strings.
- **DeliveryEtaLabel is two spans** (non-blocking): `label` ("Estimated delivery:") and
  `value` ("30 mins") are separate spans so they can carry independent color/weight.

## Out of scope for this story

Hero, delivery banner, featured menu grid, story section, and footer (all other
`proposed_new` nodes under the `home-page` frame) are not part of this story's ACs and
are not built here. Home/Menu/Cart pages get just enough body content to prove
navigation works; their real content is other backlog items.

## Architecture

**New files**
- `src/store/cartStore.js` — in-memory cart, mirrors `userStore.js`'s style:
  `getCount()`, `addItem(quantity = 1)`, `reset()`.
- `src/routes/cartApi.js` — JSON router mounted at `/api` (same convention as
  `registration.js`/`login.js`): `GET /api/cart` → `{ count }`;
  `POST /api/cart/items` → increments and returns `{ count }`. This is the minimal seam
  future "Add to Order" UI stories will call; it exists here only so AC8's live-update
  contract has something to react to.
- `src/views/siteLayout.js` — new HTML shell + `<style>` block scoped to the Forno Rosso
  token set (kept separate from `src/views/layout.js`'s Facebook-era `STYLE`, so nothing
  used by the untouched legacy pages/tests changes):
  - Colors: `--ink:#151212; --brand-red:#C82D25; --brand-green:#2A7043; --muted:#6B6661; --surface-page:#FCFAF6; --surface-warm:#F3EFE9; --surface-white:#FFFFFF; --border-card:#EBE7DF;`
  - Fonts: `font-family: 'Fraunces', Georgia, serif;` for display text, `'Geist', -apple-system, sans-serif;` for body/nav/labels (per `type_ramp_summary`; no webfont loading is added, that's a separate concern).
  - Includes `<script src="/js/cart-badge.js" defer></script>`.
- `src/views/components/siteHeader.js` — `renderSiteHeader({ activePath, cartCount, etaLabel, etaValue })`, builds the exact header markup described below.
- `src/views/pages/menuPage.js`, `src/views/pages/cartPage.js` — thin pages: `renderSiteHeader(...)` + minimal placeholder body, wrapped by `renderSiteLayout`.
- `public/js/cart-badge.js` — small UMD-style vanilla JS module (works both as a
  `require()`-able module for jsdom tests and as a plain `<script>` in the browser):
  exposes `refreshCartBadge()` (fetches `GET /api/cart`, updates `#cart-badge` text/`hidden`
  attribute) and wires it to run on `DOMContentLoaded` and on a `cart:changed` custom
  event, so any later "add to cart" UI can call
  `document.dispatchEvent(new CustomEvent('cart:changed'))` to trigger a live badge
  refresh without a page reload.

**Modified files**
- `src/views/pages/homePage.js` — rewritten to use `siteLayout` + `siteHeader` (see
  flagged conflict above) with `activePath: '/'`.
- `src/routes/web.js` — add `GET /menu` and `GET /cart`; `GET /` now calls the rewritten
  `renderHomePage()`.
- `src/app.js` — mount `cartApi` router under `/api`; add
  `app.use(express.static(path.join(__dirname, '../public')))` so `cart-badge.js` is
  servable (no static serving exists today).
- `tests/web.test.js` — update the two `GET /` describe blocks that currently assert
  Facebook branding/forms to instead assert the new Forno Rosso header content (kept in
  this file since it's the existing home for `GET /` coverage; new nav/cart-specific
  assertions go in the new `siteHeader.test.js` instead of growing this file further).
- `package.json` — add `jest-environment-jsdom` devDependency, needed only by
  `tests/cartBadge.client.test.js` via a per-file `/** @jest-environment jsdom */`
  pragma; the rest of the suite stays on the default node environment.

**Header markup/CSS, from `figma-frame.json` node `6:7` and children (exact values, not
placeholders):**
- `.site-header`: `background: var(--ink)` (#151212), full width, `height: 88px`,
  `padding: 0 80px`, `display:flex; align-items:center; justify-content:space-between`,
  `position: sticky; top: 0; z-index: 50` (AC2).
- Logo (`6:8`–`6:11`): 40×40 circle, `border-radius:20px`, `background:var(--brand-red)`,
  centered italic bold "F" (Fraunces 700 italic, 22px, white); wordmark "Forno Rosso"
  (Fraunces 600, 24px, white); 12px gap between them.
- `PrimaryNav` (`6:12`): flex row, `gap:40px`. Each `NavLink` (`6:13`/`6:16`/`6:18`):
  Geist 15px, `color:#fff`, `font-weight:500`; when `href === activePath`:
  `color:var(--brand-red)`, `font-weight:600`, plus a 12×2px `border-radius:1px`
  `background:var(--brand-red)` underline bar 4px below the label (only node `6:13`
  ships a static underline in the Figma capture because Home is the only page shown —
  the `active`/underline behavior is parameterized by `activePath` so it correctly
  follows whichever page is current, per the component map's own `active: boolean` prop).
  Links: Home → `/`, Our Menu → `/menu`, Cart → `/cart`.
- `HeaderCartSummary` (`6:20`), 12px gap: `DeliveryEtaLabel` (`6:21`) — label span
  "Estimated delivery: " Geist 400 14px white at 80% opacity, value span (e.g. "30 mins")
  Geist 600 14px `color:var(--brand-green)`; `CartIndicatorButton` (`6:22`) — pill,
  `background:rgba(255,255,255,0.10)`, `border-radius:24px`,
  `padding:10px 16px`, `gap:8px`, wraps an `<a href="/cart">`: inline 18×18 shopping-cart
  SVG icon (`6:568`/`6:569`, white, 2px round-capped stroke) + `<span id="cart-badge">`
  (Geist 600 14px white) showing `cartCount`; badge gets a `hidden` attribute when
  `cartCount === 0` (AC6).

## Known test-tooling limits (stated up front, not glossed over)

This stack has no browser/e2e tool (no Playwright/Cypress/Selenium). So:
- AC2 ("remains visible and fixed... when they scroll") is verified by asserting the
  emitted CSS contains `position: sticky; top: 0` on `.site-header` — i.e. we test that
  the *rule* is shipped, not an actual scrolled viewport. Flagging this rather than
  overstating coverage.
- AC3/AC4/AC5 ("click X THEN navigated to Y") are verified by asserting the correct
  `href` is present on the nav element/cart button and that `GET` on that href returns
  200 with the expected page — i.e. we test the navigation *contract*, not a simulated
  mouse click.
- AC8's "without a full page reload" is verified two ways: (1) an HTTP-level test proving
  the cart total updates via `/api/cart` without needing a new page render, and (2) a
  jsdom unit test proving `cart-badge.js` mutates the existing DOM node in place from a
  fetch response, which is the only reload-free mechanism available in this stack.

## AC-by-AC plan

### AC1 — header shows logo, nav labels, ETA, cart badge
- **Failing test** (`tests/siteHeader.test.js`, new): `GET /` response contains the
  brand wordmark `Forno Rosso`, the badge glyph `F`, nav links labelled exactly `Home`,
  `Our Menu`, `Cart` with `href="/"`, `href="/menu"`, `href="/cart"`, the text
  `Estimated delivery:` plus a value (e.g. `30 mins`), and a cart icon container with a
  count matching `cartStore.getCount()` (seed to 3 via `cartStore.addItem(3)` in the
  test, reset in `beforeEach`).
- **Minimal code**: `src/views/components/siteHeader.js` (`renderSiteHeader`),
  `src/views/siteLayout.js`, rewrite `src/views/pages/homePage.js` to call
  `renderSiteHeader({ activePath: '/', cartCount: cartStore.getCount(), etaLabel: 'Estimated delivery:', etaValue: '30 mins' })`.
- **Files**: `src/views/components/siteHeader.js`, `src/views/siteLayout.js`,
  `src/views/pages/homePage.js`, `src/store/cartStore.js`, `tests/siteHeader.test.js`.

### AC2 — header stays fixed to top on scroll
- **Failing test** (`tests/siteHeader.test.js`): `GET /` response's inline stylesheet
  contains a `.site-header` rule with `position: sticky` and `top: 0`.
- **Minimal code**: add those two declarations to the `.site-header` rule in
  `src/views/siteLayout.js`.
- **Files**: `src/views/siteLayout.js`, `tests/siteHeader.test.js`.

### AC3 — clicking Home navigates home
- **Failing test**: from a non-home page's header (`GET /menu`), the Home `NavLink` has
  `href="/"` and lacks `is-active`; `GET /` returns 200 and its Home `NavLink` has
  `href="/"` and is marked active (brand-red + underline element present).
- **Minimal code**: `activePath` prop threading in `siteHeader.js`; `GET /menu` route.
- **Files**: `src/views/components/siteHeader.js`, `src/routes/web.js`,
  `src/views/pages/menuPage.js`, `tests/siteHeader.test.js`.

### AC4 — clicking Our Menu navigates to the menu page
- **Failing test**: header's `Our Menu` link has `href="/menu"`; `GET /menu` returns 200,
  includes the shared header with `Our Menu` marked active, and includes a menu-page
  marker (e.g. an `<h1>Our Menu</h1>` placeholder — full menu grid is out of scope here).
- **Minimal code**: `src/views/pages/menuPage.js` + `router.get('/menu', ...)` in
  `src/routes/web.js`.
- **Files**: `src/views/pages/menuPage.js`, `src/routes/web.js`,
  `tests/siteHeader.test.js`.

### AC5 — clicking the cart icon or Cart link navigates to the cart page
- **Failing test**: header's `Cart` nav link has `href="/cart"`; the `CartIndicatorButton`
  anchor also has `href="/cart"`; `GET /cart` returns 200, includes the shared header
  with `Cart` marked active, and includes a cart-page marker (e.g. an
  `<h1>Your Cart</h1>` placeholder — itemized cart UI is out of scope here).
- **Minimal code**: `src/views/pages/cartPage.js` + `router.get('/cart', ...)` in
  `src/routes/web.js`.
- **Files**: `src/views/pages/cartPage.js`, `src/routes/web.js`,
  `tests/siteHeader.test.js`.

### AC6 — zero items → badge hidden (or "0", per settled decision: hidden)
- **Failing test**: with `cartStore.reset()` (count 0), `GET /` response's
  `#cart-badge` element carries a `hidden` attribute (no visible digit rendered).
- **Minimal code**: conditional `hidden` attribute in `siteHeader.js` when
  `cartCount === 0`.
- **Files**: `src/views/components/siteHeader.js`, `tests/siteHeader.test.js`.

### AC7 — one or more items → badge shows correct total
- **Failing test**: `cartStore.addItem(5)`, then `GET /` response's `#cart-badge`
  contains `5` and has no `hidden` attribute. Repeat with a second `addItem` call to
  confirm it's a running total, not a fixed value.
- **Minimal code**: pass live `cartStore.getCount()` into `renderSiteHeader` (already
  done for AC1); no extra logic beyond AC6's conditional.
- **Files**: `src/store/cartStore.js`, `tests/siteHeader.test.js`.

### AC8 — badge updates on cart change without full reload
- **Failing test 1** (`tests/cartApi.test.js`, new, HTTP-level): `GET /api/cart` starts
  at `{ count: 0 }`; `POST /api/cart/items` with `{ quantity: 2 }` returns
  `{ count: 2 }`; a subsequent `GET /api/cart` reflects `{ count: 2 }` — proving cart
  state can change independently of any page render.
- **Minimal code**: `src/store/cartStore.js`, `src/routes/cartApi.js`, mount in
  `src/app.js`.
- **Failing test 2** (`tests/cartBadge.client.test.js`, new,
  `/** @jest-environment jsdom */`): render a DOM fragment matching the header's cart
  markup (`#cart-badge` starting hidden at 0), mock `global.fetch` to resolve
  `{ count: 3 }`, `await require('../public/js/cart-badge.js').refreshCartBadge()`,
  assert `#cart-badge` now reads `3` and no longer has `hidden` — all via direct DOM
  mutation, with no navigation/reload involved. Also test the reverse (3 → 0 hides it
  again) and that dispatching a `cart:changed` `CustomEvent` on `document` triggers the
  same refresh.
- **Minimal code**: `public/js/cart-badge.js` (UMD export + `DOMContentLoaded`/
  `cart:changed` listeners), wired into `src/views/siteLayout.js` via
  `<script src="/js/cart-badge.js" defer></script>`, `express.static` added in
  `src/app.js`.
- **Files**: `src/store/cartStore.js`, `src/routes/cartApi.js`, `src/app.js`,
  `public/js/cart-badge.js`, `src/views/siteLayout.js`, `tests/cartApi.test.js`,
  `tests/cartBadge.client.test.js`, `package.json` (add `jest-environment-jsdom`).

## Cross-cutting cleanup task

- Update `tests/web.test.js`'s two `GET /` describe blocks (currently asserting
  Facebook branding/forms) to assert the new Forno Rosso home page content instead, per
  the flagged conflict above. No other existing test file is touched.
