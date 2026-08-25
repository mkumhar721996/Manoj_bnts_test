# MT-STORY-040 — Popular pizzas menu browsing & add-to-order

## Design source
`.arc/designs/design-context.json`'s resolved tokens/component map (reproduced in this run's
context) is the primary source. Cross-checked against `.arc/designs/figma-section-6-54-featured-section.png`
(featured grid: `SectionHeading` eyebrow "Chef Recommendations" / title "Popular Sourdough
Pizzas" / underline accent, then 4 white `PizzaCard`s — image, name, red price, description,
full-width dark "+ Add to Order" button) and `.arc/designs/figma-section-6-7-header.png`
(dark `SiteHeader`: red monogram `BrandLogo` "Forno Rosso", `NavBar` Home/Our Menu/Cart,
right-aligned ETA text + pill `CartButton` with cart icon and item count). `figma-frame.json`
was spot-checked (nodes `6:54`–`6:69`) for exact copy/order; the full file is 9.3MB so it was
queried by node id rather than read whole. All four `PizzaCard` copy blocks (name, price,
description) were read directly off the design and are reproduced verbatim in the seed data
below.

## Conflict with existing, shipped, tested code — flagging, not silently resolving
`GET /` is already implemented and tested: `src/routes/web.js:20` renders
`src/views/pages/homePage.js`, a **Facebook-branded** landing page (login + registration
cards) built for MT-STORY-024, asserted by `tests/web.test.js`'s `AC1: Facebook-branded
homepage on load` and `AC2: registration form visible on the homepage` blocks. This story's
approved design is a completely different product at the same route: a "Forno Rosso"
pizzeria marketing page (`frame 6:6`, `home-page`). There is no way to satisfy this story's
AC1 ("GIVEN the home page loads... it displays exactly the pizzas currently flagged as
featured...") without replacing what `GET /` renders, which necessarily removes the Facebook
brand/login/registration markup from that route.

**Resolution taken** (flagging for reviewer sign-off): rewrite `src/views/pages/homePage.js`
to render the approved pizzeria design, and delete the two now-inapplicable describe blocks in
`tests/web.test.js` (`AC1: Facebook-branded homepage...`, `AC2: registration form visible on
the homepage...`) since the markup they assert on no longer exists at `GET /`. The
`POST /register` / `POST /login` endpoints and their own describe blocks (AC3–AC6 in that same
file) are **not** touched — they don't render on `GET /`, they're exercised directly via
`supertest` POSTs, and remain fully functional; they simply lose their homepage UI entry point
(no login/registration cards are shown on the new marketing page, matching the approved
design, which has none). If this route collision is not acceptable, the alternative is serving
the pizzeria page from a different path (e.g. `/home`) and leaving `/` as the Facebook page —
but that contradicts AC1's literal "the home page" and the design's frame being named
`home-page`, so it is not the default here.

## Second scoping decision: which sections of the frame this story builds
The frame's `home-page` has six sections (header, hero, delivery banner, featured section,
brand-story section, footer), but this story's ACs only concern two of them: the `SiteHeader`
(for the cart badge, AC5/AC6) and the `featured-section`/`PopularPizzasSection` (AC1–AC4,
AC7). The parent epic explicitly separates "hero pitch," "trust signals," and "popular-pizza
showcase" as distinct concerns, and no AC here mentions hero copy, the delivery banner, the
brand story, or the footer. Building those speculatively would be scope creep with no test
driving it. **This plan builds only `SiteHeader` + `PopularPizzasSection`** as the full content
of `GET /` for now; AC4's "the rest of the page continues to render normally" is verified
against the `SiteHeader` staying intact when the featured section errors. Hero/delivery-banner/
brand-story/footer are left for other stories under the same epic — noted again under "Out of
scope."

## Architecture decisions
- **New CSS, not a rewrite of the shared `src/views/layout.js`.** That file's `<style>` is
  shared by `registrationErrorPage.js`, `registrationSuccessPage.js`, `loginErrorPage.js`,
  `feedPage.js` — all still-shipped Facebook-clone screens with their own passing tests.
  Swapping its tokens for the pizzeria palette would visually reskin those unrelated pages as a
  side effect. Instead, `homePage.js` becomes fully self-contained: a new
  `src/views/pages/homePageStyle.js` exports the pizzeria `<style>` block (tokens per the
  design: `--bg:#FCFAF6`, `--surface:#FFFFFF`, `--border:#EBE7DF`, `--fg:#151212`,
  `--muted:#6B6661`, `--brand:#C82D25`, `--brand-success:#2A7043`, font families
  `Fraunces`/`Geist`, the given spacing/radius scales), and `homePage.js` assembles its own
  full `<!DOCTYPE html>` document instead of calling `renderLayout()`. `layout.js` is not
  modified.
- **"Backend data source" is modeled as an async service**, consistent with this repo's
  existing convention of in-memory stores standing in for real backends
  (`userStore`, `verificationTokenStore`, `emailService`), so that AC4's "fails or times out"
  is genuinely exercised rather than asserted by fiat:
  - `src/store/pizzaStore.js` — in-memory pizza catalog (seeded with the 4 design pizzas,
    `featured: true`, plus one additional non-featured pizza to prove the `featured` filter is
    real). `fetchFeatured()` returns a `Promise` resolving to the catalog's featured items (no
    cap here — capping is the service's job per AC1's "up to four"). Test-only helpers:
    `_setCatalog(list)` (override the catalog, for AC2/AC3), `_setFailureMode('reject' |
    'hang' | null)` (AC4's "fails" and "times out" respectively), `reset()`.
  - `src/services/menuService.js` — `getFeaturedPizzas()` races `pizzaStore.fetchFeatured()`
    against a `setTimeout`-based rejection (`FEATURED_FETCH_TIMEOUT_MS`), and on success slices
    the result to the first 4 items (AC1's cap). Any rejection (explicit failure or timeout)
    propagates as a single rejected promise, so `web.js`'s route handler has one `catch` for
    both failure modes.
  - `src/routes/web.js`'s `GET /` becomes `async`, `await`s `menuService.getFeaturedPizzas()`
    in a `try/catch`, and passes `{ featuredPizzas, featuredError }` into `renderHomePage`.
- **Client-side cart/toast logic is a real, separately-loaded script**, not inline in the HTML
  string, so it can be unit-tested: `src/public/js/pizzaMenu.js`, served as a static asset.
  `src/app.js` gains `express.static(path.join(__dirname, 'public'))`. The page includes
  `<script src="/js/pizzaMenu.js" defer></script>` at the end of `<body>`; because of `defer`,
  the DOM is already parsed by the time it runs, so the script does its setup (query
  `.add-to-order-btn` elements, wire click handlers) immediately at top level with no
  `DOMContentLoaded` wrapper needed — this also keeps it trivial to test (see below).
  Cart count is plain in-memory client state (a JS variable), reset on every page load —
  consistent with this codebase's existing precedent of no persistent session/cart across
  requests (see MT-STORY-024's "no persistent session/cookie" scoping note); no AC asks for
  the cart to survive a reload.
- **New devDependency: `jest-environment-jsdom`.** This repo's tests are 100% `supertest`
  against a Node HTTP server; there is no DOM available today. AC5–AC7 are inherently
  client-DOM behaviors (badge text mutates without a page reload, a toast auto-dismisses).
  Testing them at all requires a DOM. Rather than pull in a headless-browser tool (Playwright/
  Puppeteer — a much bigger addition), the plan adds `jest-environment-jsdom` (an official,
  minimal Jest companion package) and opts individual new test files into it via a
  `/** @jest-environment jsdom */` docblock, leaving every existing `supertest`-based test file
  on Jest's default `node` environment untouched.
- **Images**: the four `PizzaCard` photos are the approved exported assets
  `.arc/designs/figma-asset-6-{62,74,86,98}-featured-grid.png`. They are binary files, so this
  plan copies them (not a `Write`-tool text edit) to `src/public/images/pizzas/{diavola,
  funghi-selvatici-tartufo,classic-margherita,prosciutto-crudo}.png` and references them via
  `<img src="/images/pizzas/...">`.

## File layout
```
src/store/pizzaStore.js                 # new
src/services/menuService.js             # new
src/views/pages/homePageStyle.js        # new — pizzeria <style> block (self-contained)
src/views/pages/homePage.js             # rewritten — Forno Rosso SiteHeader + PopularPizzasSection
src/public/js/pizzaMenu.js              # new — cart count + toast client script
src/public/images/pizzas/*.png          # new — copied design assets (binary, not code)
src/routes/web.js                       # modify — GET '/' becomes async, calls menuService
src/app.js                              # modify — add express.static for src/public
tests/web.test.js                       # modify — remove the two obsolete Facebook-homepage describes
tests/home.test.js                      # new — supertest coverage, AC1–AC4
tests/homeInteractions.test.js          # new — jsdom coverage, AC5–AC6 (+ pins AC7's CSS)
package.json                            # modify — add jest-environment-jsdom devDependency
```

## Seed data (`pizzaStore.js`), copied verbatim from the design
| name | price | description | image | featured |
|---|---|---|---|---|
| Diavola | $16.50 | Spicy calabrian salami, house-pulled fresh mozzarella, san marzano tomato base, organic chili oil, fresh basil leaves. | `/images/pizzas/diavola.png` | true |
| Funghi Selvatici & Tartufo | $18.00 | Roasted wild porcini and cremini mushrooms, truffle-infused olive oil, white mozzarella base, shaved pecorino. | `/images/pizzas/funghi-selvatici-tartufo.png` | true |
| Classic Margherita | $14.50 | Imported San Marzano tomato sauce, fresh buffalo mozzarella, fragrant fresh basil, extra virgin olive oil. | `/images/pizzas/classic-margherita.png` | true |
| Prosciutto Crudo e Rucola | $19.00 | Prosciutto di Parma cured ham, fresh peppery wild arugula, shaved parmigiano-reggiano, balsamic glaze reduction. | `/images/pizzas/prosciutto-crudo.png` | true |
| Quattro Formaggi | $17.00 | (placeholder, not in the design — exists only to prove the `featured` filter excludes it) | `/images/pizzas/quattro-formaggi.png` (reuse any existing image) | false |

## TDD build order

### AC1 — featured-pizzas section renders up to 4 flagged pizzas with image/name/price/description
- **Failing test first** (`tests/home.test.js`, new): `GET /` → `200`, HTML; body contains a
  `pizza-card-grid` with exactly 4 `pizza-card` elements, and for each of the 4 design pizzas
  (Diavola, Funghi Selvatici & Tartufo, Classic Margherita, Prosciutto Crudo e Rucola) the
  card contains its `<img src="/images/pizzas/...">`, name, price (`$16.50` etc.), and full
  description text; body does **not** contain "Quattro Formaggi" (proves the `featured` filter
  is applied, not just "return everything"). Also assert the `SiteHeader` is present (`Forno
  Rosso` brand wordmark, `Home`/`Our Menu`/`Cart` nav links, cart button).
- **Minimal code**: `pizzaStore.js` (catalog + `fetchFeatured()`), `menuService.js`
  (`getFeaturedPizzas()`, cap at 4), `homePageStyle.js`, `homePage.js` (renders `SiteHeader` +
  `SectionHeading` "Chef Recommendations"/"Popular Sourdough Pizzas" + a `PizzaCard` per item,
  each with `escapeHtml`-ed name/description and an "+ Add to Order" `<button
  class="add-to-order-btn" data-pizza-name="...">`), `web.js` GET `/` calling
  `menuService.getFeaturedPizzas()` and passing the array in.
- **Files**: create `src/store/pizzaStore.js`, `src/services/menuService.js`,
  `src/views/pages/homePageStyle.js`, `tests/home.test.js`; rewrite
  `src/views/pages/homePage.js`; modify `src/routes/web.js`.

### AC2 — fewer than 4 featured pizzas: only those are shown, no empty placeholders
- **Failing test first** (`tests/home.test.js`): using `pizzaStore._setCatalog([...two featured
  pizzas...])` in a test (restored via `pizzaStore.reset()` in `afterEach`), `GET /` → body
  contains exactly 2 `pizza-card` elements and no placeholder/skeleton markup (assert the grid
  container's `pizza-card` count via a regex/match-count, not just "contains").
- **Minimal code**: none beyond AC1's — `PizzaCardGrid` already just maps over whatever array
  it's given; this test locks that in.
- **Files**: modify `tests/home.test.js` only.

### AC3 — zero featured pizzas: graceful empty state
- **Failing test first** (`tests/home.test.js`): `pizzaStore._setCatalog([])`, `GET /` → `200`,
  body contains zero `pizza-card` elements and an empty-state message (e.g. "No featured
  pizzas are available right now — check back soon!") inside the `PopularPizzasSection`, and
  the `SectionHeading` ("Popular Sourdough Pizzas") is still shown above it.
- **Minimal code**: `homePage.js`'s section renders the empty-state `<p>` when
  `featuredPizzas.length === 0` instead of an empty grid.
- **Files**: modify `src/views/pages/homePage.js`, `tests/home.test.js`.

### AC4 — backend fetch fails or times out: error state shown, rest of page still renders
- **Failing test, "fails" path** (`tests/home.test.js`): `pizzaStore._setFailureMode('reject')`,
  `GET /` → `200` (not a 5xx — the page itself must still load), body contains an error-state
  message inside `PopularPizzasSection` (e.g. "We couldn't load our featured pizzas. Please try
  again later.") instead of any `pizza-card`, **and** the `SiteHeader` (brand wordmark, nav
  links, cart button) is still present and intact — proving the rest of the page rendered
  normally.
- **Failing test, "times out" path** (`tests/menuService.test.js`, new, small, `node` env — no
  HTTP layer, so real `jest.useFakeTimers()` is safe here without interfering with an in-flight
  supertest request): `pizzaStore._setFailureMode('hang')` (returns a promise that never
  resolves), call `menuService.getFeaturedPizzas()`, `jest.advanceTimersByTime
  (FEATURED_FETCH_TIMEOUT_MS)`, assert the returned promise rejects. This proves the timeout
  path produces the same kind of rejection the "fails" end-to-end test already proves
  `web.js`'s single `catch` handles — the two tests together cover AC4 without needing
  fake-timers + real HTTP in the same test (a known source of flakiness).
- **Minimal code**: `menuService.getFeaturedPizzas()`'s `Promise.race`/timeout logic (if not
  already fully built in AC1's minimal slice); `web.js`'s `try/catch` around the `await`,
  setting `featuredError: true` on any rejection; `homePage.js` renders the error `<p>` when
  `featuredError` is true (checked before the empty-state branch).
- **Files**: create `tests/menuService.test.js`; modify `src/services/menuService.js`,
  `src/routes/web.js`, `src/views/pages/homePage.js`, `tests/home.test.js`.

### AC5 — clicking "Add to Order" increments the cart badge immediately + shows an auto-dismissing toast
- **Failing test first** (`tests/homeInteractions.test.js`, new,
  `/** @jest-environment jsdom */`): render the real homepage HTML via
  `renderHomePage({ featuredPizzas: <2+ seed pizzas> })`, set it as
  `document.documentElement.innerHTML`, then execute the real
  `src/public/js/pizzaMenu.js` source (read via `fs.readFileSync`, run via `new
  Function(source)()` so it executes against the test's jsdom globals) to wire up behavior.
  `jest.useFakeTimers()`. Click the first card's `.add-to-order-btn`; assert
  `#cartCount`'s text becomes `"1"` immediately (no `await`/timer needed), and a `.toast`
  element appears in `#toastContainer` containing the clicked pizza's name (e.g. "Added to
  order: Diavola"). `jest.advanceTimersByTime(TOAST_DURATION_MS)`; assert the `.toast` element
  is removed from the DOM (auto-dismiss).
- **Minimal code**: `homePage.js` adds `<span id="cartCount">0</span>` inside the `CartButton`
  and a `<div id="toastContainer" aria-live="polite"></div>`; `pizzaMenu.js`: a module-scope
  `cartCount = 0`; a click listener on each `.add-to-order-btn` that increments `cartCount`,
  writes it to `#cartCount`, creates a `.toast` div with text `Added to order: <name>` from the
  button's `data-pizza-name`, appends it to `#toastContainer`, and `setTimeout`s its removal
  after `TOAST_DURATION_MS` (e.g. 3000).
- **Files**: create `src/public/js/pizzaMenu.js`, `tests/homeInteractions.test.js`; modify
  `src/views/pages/homePage.js`; modify `package.json` (add `jest-environment-jsdom`
  devDependency).

### AC6 — cart badge reflects the cumulative total across different cards
- **Failing test first** (`tests/homeInteractions.test.js`): with 2+ cards rendered, click card
  1's `.add-to-order-btn`, then card 2's (a **different** pizza); assert `#cartCount` reads
  `"2"` after the second click (cumulative, not reset per click), and that two separate `.toast`
  elements were created (one per click, each naming its own pizza).
- **Minimal code**: none beyond AC5's — `cartCount` is already a running total incremented per
  click, not reset; this test locks that behavior in.
- **Files**: modify `tests/homeInteractions.test.js` only.

### AC7 — mobile viewport: pizza grid fully visible/legible, no horizontal scrolling
- **Failing test first** (`tests/homeInteractions.test.js` or a small new
  `tests/homePageStyle.test.js`, plain `node` env, no jsdom needed): assert
  `homePageStyle.js`'s exported CSS string contains a mobile-width media query (e.g. `@media
  (max-width: 640px)`) that (a) collapses `.pizza-card-grid`'s `grid-template-columns` to a
  single column and (b) makes `.site-header`'s nav wrap or hide rather than force a fixed wide
  row. This is a pinning test on the stylesheet's intent, not a real layout assertion.
- **Minimal code**: add the mobile media query to `homePageStyle.js`: `.pizza-card-grid` at
  `1fr` under the breakpoint (each `PizzaCard` full-width, stacked), `.site-header`'s `NavBar`
  wrapping (`flex-wrap: wrap`) or collapsing so it doesn't force a minimum row width wider than
  the viewport.
- **Files**: create `tests/homePageStyle.test.js` (or extend `homeInteractions.test.js`);
  modify `src/views/pages/homePageStyle.js`.
- **Manual verification (required, not automated)**: this repo has no real browser/rendering
  test tool, so jsdom cannot verify actual computed widths or the absence of a horizontal
  scrollbar — that would require a real layout engine. Per the standing instruction to verify
  UI changes in a browser, start the app (`node src/server.js`) and check `GET /` at a mobile
  viewport (e.g. 375×667 in devtools) before calling this AC done: confirm all 4 cards are
  full-width, text isn't clipped, and there is no horizontal scrollbar. This will be called out
  again as an explicit manual step when reporting completion — it is not something the test
  suite can claim to prove.

## Test hygiene
- `tests/home.test.js` and `tests/menuService.test.js` call `pizzaStore.reset()` (and, where
  relevant, restore any `_setCatalog`/`_setFailureMode` override) in `afterEach` so tests don't
  leak state.
- `tests/homeInteractions.test.js` opts into jsdom per-file via
  `/** @jest-environment jsdom */`; every other existing test file is untouched and keeps
  running under Jest's default `node` environment.
- Each new describe block is labeled with this story's AC number (`AC1`..`AC7`), matching the
  convention already used in `tests/registration.test.js`/`tests/verification.test.js`/
  `tests/login.test.js`/`tests/web.test.js`.

## Out of scope (explicitly not built, per "stay within ACs")
- Hero section, delivery banner, brand-story section, and footer (nodes `6:25`, `6:40`,
  `6:108`, `6:136`) — no AC in this story covers them; per the epic they are separate concerns.
  `GET /` for now renders only `SiteHeader` + `PopularPizzasSection`.
- A real `/cart` page or `/menu` page — the `NavBar`'s "Cart"/"Our Menu" links and the
  `CartButton` are rendered per the design but are non-navigating (`href="#"`)/inert; no AC
  asks for a cart or full-menu page, only for the badge count and toast feedback.
- Cart persistence across page reloads/sessions, or any server-side cart state — the cart is
  purely client-side, in-memory JS state, reset on every load, consistent with this codebase's
  existing "no persistent session" precedent (MT-STORY-024).
- Server-side "add to order" endpoint/API — AC5/AC6 only require immediate client feedback
  (badge + toast); no AC asks for the addition to be recorded server-side or survive a reload.
- Hover/pressed/disabled/sold-out states on the "Add to Order" button, and the header/cart
  "same destination vs. drawer" question — both are open questions in the design context marked
  non-blocking or already resolved by assumption; only the rest (default) state is built.
- Real browser/visual regression testing (Playwright/Cypress) — not added; AC7's true
  cross-device rendering is verified manually per the note above, not by the automated suite.
