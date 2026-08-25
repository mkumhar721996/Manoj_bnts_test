# MT-STORY-026 — Marketing Landing Page (Forno Rosso)

## Context / codebase conventions
This repo is a plain Express app with **no template engine, no client framework, no bundler**:
pages are HTML template-literal strings returned by `src/views/pages/*.js`, wrapped by a shared
`renderLayout()` (`src/views/layout.js`), and mounted in `src/routes/web.js` /
`src/routes/*.js`. Tests are Jest + Supertest, asserting directly on response status/HTML string
content (`tests/*.test.js`), with in-memory stores exposing `reset()` for isolation. This plan
follows the same conventions rather than introducing a framework/build step.

## Conflict to flag, not silently resolve: this story's home page vs. the existing `GET /`
`GET /` currently renders a completely different, already-shipped product surface: a
"Facebook" clone homepage (`src/views/pages/homePage.js`, tested by the `AC1`/`AC2` describe
blocks in `tests/web.test.js`) built for earlier stories (MT-STORY-013/019/020/024). This
story's AC1 requires the **same route** (`/`, "the home page") to render the Forno Rosso hero
instead. These cannot both be true at once — there is no version of `GET /` that satisfies both
"shows the Facebook brand" and "shows a Forno Rosso hero with 'Order Online Now'/'Explore Full
Menu'". Since AC1–AC7 explicitly describe the approved design for "the home page," I'm treating
this story's design as superseding the old homepage content, not as an addition alongside it.

**Resolution taken (flagging for reviewer sign-off):** `src/views/pages/homePage.js` is rewritten
to the Forno Rosso landing page; the two `tests/web.test.js` describe blocks that assert the old
Facebook-branded `GET /` content (`AC1: Facebook-branded homepage on load`, `AC2: registration
form visible on the homepage`) are removed and replaced with this story's own `GET /` assertions.
`POST /register` and `POST /login` (and their describe blocks `AC3`–`AC6` in the same file) are
**untouched** — they don't inspect `GET /` output, so they keep passing unmodified; only their
login/registration forms lose their home on `/` (no AC in this story asks for them to move
anywhere, so they become server-side-only endpoints with no linking UI — flagged under "Out of
scope" below, not silently dropped).

## Design-fidelity decisions (flagging rather than guessing)
- **Separate layout, not a shared one.** `src/views/layout.js`'s `<style>` block encodes the old
  Facebook app's own token set (`--brand`, `--radius-sm: 6px`, `.hero`, `.card`, etc.) and is still
  used by the untouched registration/login/feed pages. Rather than merging two unrelated design
  systems into one `<style>` block, this plan adds a new `src/views/marketingLayout.js` exporting
  `renderMarketingLayout(title, bodyHtml)`, with its own `<style>` built from this story's
  approved tokens (`ink #151212`, `brand-red #C82D25`, `brand-green #2A7043`, `muted-on-light
  #6B6661`, `surface-cream #FCFAF6`, `surface-warm #F3EFE9`, spacing scale
  `2/4/6/8/10/12/16/20/24/32/40/48/64/80/96/120`, radii `xs 1 / sm 1.5 / md 8 / lg 16 / lg-alt 18 /
  xl 20 / 2xl 24 / full 100`, and the full type ramp — `hero-title` Fraunces 700/64/70.4,
  `section-title` Fraunces 700/40/49.32, `card-title` Fraunces 600/20/24.66, `wordmark` Fraunces
  600/24/29.59, `feature-title` Fraunces 600/18/22.19, `nav-link`/`nav-link-active` Geist
  500|600/15/19.5, `body` Geist 400/14/19.6, `body-lg` Geist 400/18/27, `button-label` Geist
  600/16/20.8, `price` Geist 700/18/23.4, `eyebrow-label` Geist 600/13/16.9 uppercase). This is a
  new file, so it cannot regress the existing suite.
- **Fonts.** Recorded assumption is "self-host Geist, load Fraunces from Google Fonts." This plan
  does the Fraunces half literally (`<link>` to Google Fonts in `marketingLayout.js`'s `<head>`).
  For Geist, since there is no bundler/build step in this app to process an npm font package or
  Fontsource import, self-hosting would mean manually vendoring font files with no AC that tests
  font rendering to justify that infra work. This plan uses the CSS stack
  `'Geist', ui-sans-serif, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif` (attempts Geist,
  falls back to system sans) instead of standing up font hosting — a deliberate, smaller-scope
  reading of that assumption, called out here rather than silently expanded into new build
  tooling.
- **Icons.** The component map's `Icon(name)` nodes (e.g. `fire-extinguisher`, `arrow-right`,
  `truck`, `plus`, `shopping-cart`, `star`, `shield`, `compass`) have no exported vector source in
  this repo (only rasterized section/asset PNGs, not per-icon SVGs). `src/views/components/icon.js`
  renders a small hand-authored inline `<svg data-icon="{name}">` per name — reasonable-fidelity
  glyphs, not a pixel-exact trace of the Figma vectors, since those vectors weren't exported.
  Tests assert on `data-icon="…"` + surrounding text, not exact path data. Per the recorded,
  already-answered "keep-extinguisher" decision, the hero eyebrow pill keeps
  `Icon(name="fire-extinguisher")` as drawn, not a flame substitute.
- **Images.** The 4 pizza-card photos, hero photo, and 2 story-collage photos are the actual
  approved assets, exported to `.arc/designs/figma-asset-*.png`. This plan copies them (not
  re-derives them) into a new `public/images/` folder so they can be served, and references them
  by `src`:
  - `figma-asset-6-39-hero-image-wrapper.png` → `public/images/hero.png`
  - `figma-asset-6-62-featured-grid.png` → `public/images/pizza-diavola.png`
  - `figma-asset-6-74-featured-grid.png` → `public/images/pizza-funghi-tartufo.png`
  - `figma-asset-6-86-featured-grid.png` → `public/images/pizza-margherita.png`
  - `figma-asset-6-98-featured-grid.png` → `public/images/pizza-prosciutto-rucola.png`
  - `figma-asset-6-134-story-img-collage.png` → `public/images/story-dough.png`
  - `figma-asset-6-135-story-img-collage.png` → `public/images/story-oven.png`
  All use `object-fit: cover` per the design notes.
- **Cart line items have no exported design.** The Figma frame is the home page only; there is no
  cart drawer/page node anywhere in it, only the header's `CartButton` (`count` prop) and a
  separate `NavLink` labelled "Cart" (open question `duplicate-cart-entry-points`, assumed to
  share a destination). AC4/AC5 nonetheless require that added items be visible as line items
  somewhere and that the badge react. Since no cart UI is designed, this plan adds one small,
  **undesigned-but-necessary** addition: a popover `#cart-panel` anchored under the header
  `CartButton`, built only from already-approved tokens (white background, `--border-card` 1px
  stroke, `radius: md`, `body`/`price` type roles) so it doesn't invent new visual language — it's
  flagged here explicitly as implementation scaffolding, not a Figma-sourced component, pending a
  real cart-page design in a future story. The header `NavLink` "Cart" is rendered per the design
  but is not wired to open/close anything and has no dedicated test — no AC governs its behavior,
  only the icon `CartButton` does (AC4/AC5).
- **Badge starting value.** The Figma mock shows `CartButton` with a hardcoded illustrative
  `count: 3`. A freshly loaded page has an empty cart, so this plan renders the badge starting at
  `0`, diverging from the mock's placeholder number (which was never meant as real seed data).
- **"Order Online Now" destination.** AC7 explicitly lists `'Order Online Now'` alongside
  `'Explore Full Menu'` and `'Our Menu'` as all navigating to "the menu browsing page." There is
  no separate ordering/checkout page in this story's design or ACs, so, per AC7's literal wording,
  all three point at the same `/menu` route.
- **Footer, social icons, kitchen-hours/location columns.** No AC (1–7) mentions the footer at
  all. Per "stay strictly within the ACs; no speculative work," this plan does not build
  `SiteFooter`/`FooterCol`/`SocialRow` — even though they exist in the reviewed Figma frame, they
  sit outside every AC's described section. Flagged under "Out of scope" below rather than
  silently added or silently dropped.
- **Header ETA text** (`HeaderCart` "Estimated delivery: 30 mins") is trivial static copy that is
  part of the same header markup AC7's nav link and AC4/AC5's `CartButton` already require
  building; it's included for design fidelity but has no dedicated test of its own (no AC asks for
  it).
- **Delivery banner / feature-list exact copy**, read from `.arc/designs/figma-frame.json` since
  the summary didn't carry it verbatim:
  - Banner heading (6:45): "Free Delivery On Orders Over $35"
  - Banner subtext (6:46): "Craving quality? Skip the delivery fee entirely inside our active zones."
  - Hero description (6:31): "Baked at 900°F in our stone ovens to perfect charred perfection. Handcrafted sourdough bases fermented for 48 hours. Order now for fast, direct thermal-bag delivery."
  - Story description (6:113): "At Forno Rosso, we respect the traditions of Neapolitan pizzaiolos while implementing modern techniques. We ferment our proprietary sourdough mother starter for 48 hours. This process creates a light, bubbly, and incredibly digestible dough with complex flavor profiles."
- **Card-height variance (`pizza-card-height-variance`)**: per the already-recorded resolution,
  `PizzaCard`'s description area gets a fixed height (line-clamped) so all four cards render at a
  uniform height in code, instead of reproducing Prosciutto's extra text line as uneven internal
  gap.
- **Stat alignment (`stat-label-alignment`)**: per the already-recorded resolution, `StatItem`
  takes a single `align` prop applied to the label only; the value is always left-aligned.

## Client-side cart mechanism (no backend persistence)
AC4/AC5 need in-page state changes on click with no full navigation. This app ships no JS
anywhere today. This plan adds exactly one small vanilla script, `public/js/cart.js`, served via a
new `express.static` mount, that:
- Keeps a module-scoped `cart` array of `{ id, name, price, quantity }`.
- Delegates a `click` listener on `document` for `[data-item-id]` "Add to Order" buttons.
- On click: finds an existing line by `id`; if present, increments `quantity`; otherwise appends a
  new line with `quantity: 1` (AC4 vs. AC5).
- Re-renders `#cart-line-items` (one `<li data-item-id="…">` per line, textContent only — no
  `innerHTML` string interpolation, even though the interpolated name/price come from our own
  static markup, not user input) and sets `#cart-badge`'s text to the sum of all `quantity`s. Using
  the summed-quantity as the badge value means every "Add to Order" click — new item or existing —
  increments the visible badge by exactly one, satisfying both ACs with one rule.

**Testing a vanilla script with no bundler:** a new test file, `tests/homePageCart.test.js`, uses
the `/** @jest-environment jsdom */` docblock (opting only this file into jsdom; every other test
file keeps Jest's default `node` environment, so no existing test is affected). It renders the
real `homePage.js` output into `document` via `DOMParser`, then `require()`s the real
`public/js/cart.js` file directly (a plain script using the ambient `document`/`window` jsdom
globals — no export/import wiring needed) so the exact shipped file is what's under test, wrapped
in `jest.isolateModules` per test so the module-scoped `cart` array starts empty each time. This
needs a new devDependency, `jest-environment-jsdom` (Jest 29 externalized it from core).

## File layout
```
src/views/marketingLayout.js         # new: renderMarketingLayout(title, bodyHtml) + this story's <style>
src/views/components/siteHeader.js   # new: renderSiteHeader({ active }) — Logo, NavLinks, HeaderCart/CartButton/#cart-panel
src/views/components/icon.js         # new: renderIcon(name) — inline SVG per icon name
src/views/pages/homePage.js          # rewrite: hero, delivery banner, featured carousel, story section
src/views/pages/menuPage.js          # new: minimal stub page, AC7's navigation target
src/routes/web.js                    # modify: GET '/' → new renderHomePage(); add GET '/menu'
src/app.js                           # modify: mount express.static(public/)
public/js/cart.js                    # new: client-side cart state + DOM rendering
public/images/*.png                  # new: copied from .arc/designs/figma-asset-*.png (see mapping above)
tests/web.test.js                    # modify: remove old Facebook AC1/AC2 blocks; add MT-STORY-026 AC1/2/3/6/7 blocks
tests/homePageCart.test.js           # new: AC4/AC5 (jsdom)
package.json                         # modify: add devDependency jest-environment-jsdom
```

## TDD task breakdown

### AC1 — hero section with 'Order Online Now' and 'Explore Full Menu' CTAs
- **Failing test first** (`tests/web.test.js`, replace the old `AC1`/`AC2` Facebook blocks with a
  new `MT-STORY-026 AC1: hero section with primary CTAs` describe): `GET /` → `200`,
  `Content-Type` HTML; body contains the hero heading's two spans ("Wood-Fired Pizza," plain,
  "Delivered Hot" in `brand-red`), and two CTA anchors both `href="/menu"`: one containing
  "Order Online Now" styled as the primary button (`Icon(name="arrow-right")` trailing), one
  containing "Explore Full Menu" styled as the outline button.
- **Minimal code:** `src/views/marketingLayout.js`, `src/views/components/icon.js`
  (`fire-extinguisher`, `arrow-right`), `src/views/components/siteHeader.js` (Logo, NavLinks
  Home/Our Menu/Cart, HeaderCart shell with `#cart-badge` starting at `0` and `#cart-button`/
  `#cart-panel` — built now since the header must render, exercised further by AC4/5/7's own
  tests), `src/views/pages/homePage.js` hero section (`EyebrowPill` "AUTHENTIC NEAPOLITAN
  WOODFIRED", `HeroHeading`, hero description copy above, two CTA anchors, `HeroImage` at
  `/images/hero.png`), `src/routes/web.js` `GET '/'` rewired to the new `renderHomePage()`,
  `src/app.js` adds `express.static(path.join(__dirname, '..', 'public'))`.
- **Files:** create `src/views/marketingLayout.js`, `src/views/components/siteHeader.js`,
  `src/views/components/icon.js`, `public/images/hero.png`; rewrite
  `src/views/pages/homePage.js`; modify `src/routes/web.js`, `src/app.js`, `tests/web.test.js`.

### AC2 — delivery/value promotional banner visible
- **Failing test first** (`tests/web.test.js`, `MT-STORY-026 AC2: delivery banner`): body contains
  the `IconCircle(truck)` banner with heading "Free Delivery On Orders Over $35", subtext "Craving
  quality? Skip the delivery fee entirely inside our active zones.", and the `StatsRow` with both
  `StatItem`s: label "Average ETA" / value "25 - 35 Min", and label "Pizza Temperature" / value
  "Piping Hot Guaranteed".
- **Minimal code:** `DeliveryBanner` section in `homePage.js` (green `brand-green` background,
  `IconCircle`, heading/subtext, `StatsRow`/`StatItem` per the alignment decision above); add
  `truck` to `icon.js`.
- **Files:** modify `src/views/pages/homePage.js`, `src/views/components/icon.js`,
  `tests/web.test.js`.

### AC3 — chef-recommended pizza carousel (image, name, 'Add to Order' per item)
- **Failing test first** (`tests/web.test.js`, `MT-STORY-026 AC3: chef-recommended carousel`):
  body contains the `SectionHeading` (eyebrow "Chef Recommendations", title "Popular Sourdough
  Pizzas", centered underline), and 4 `PizzaCard`s, each with: an `<img>` at its
  `/images/pizza-*.png` src, its name text (Diavola / Funghi Selvatici & Tartufo / Classic
  Margherita / Prosciutto Crudo e Rucola), its price, and a button/link labelled "Add to Order"
  carrying `data-item-id` = a stable slug (`diavola` / `funghi-tartufo` / `margherita` /
  `prosciutto-rucola`) plus `data-item-name`/`data-item-price`.
- **Minimal code:** `FeaturedSection`/`FeaturedGrid`/`PizzaCard` x4 in `homePage.js` using the
  exact names/prices/descriptions from the component map, `Icon(plus)` on each button, clamped
  description height per the card-height-variance decision; copy the 4 pizza PNGs into
  `public/images/`.
- **Files:** modify `src/views/pages/homePage.js`, `src/views/components/icon.js`; add 4 PNGs
  under `public/images/`; modify `tests/web.test.js`.

### AC4 — 'Add to Order' on a new item creates a line item and increments the badge
- **Failing test first** (`tests/homePageCart.test.js`, new file, `@jest-environment jsdom`):
  render the real `homePage.js` HTML into `document`, `require` the real `public/js/cart.js`;
  assert `#cart-badge` starts at `'0'` and `#cart-line-items` is empty (empty-state message
  visible); simulate a click on Diavola's "Add to Order" button; assert `#cart-badge` becomes
  `'1'` and `#cart-line-items` contains exactly one `<li data-item-id="diavola">` showing the name
  and a quantity of 1.
- **Minimal code:** `public/js/cart.js` — click delegation, an `addItem` reducer (may start
  naively "always append," since this is the first test and only exercises the new-item path),
  and a render function updating `#cart-badge`/`#cart-line-items`; wire `<script src="/js/cart.js"
  defer></script>` at the end of `renderMarketingLayout`'s body; add `#cart-badge`, `#cart-button`,
  `#cart-panel`/`#cart-line-items` markup to `siteHeader.js` (already scaffolded in AC1, filled in
  here); add `jest-environment-jsdom` devDependency.
- **Files:** create `public/js/cart.js`, `tests/homePageCart.test.js`; modify
  `src/views/components/siteHeader.js`, `src/views/marketingLayout.js`, `package.json`.

### AC5 — 'Add to Order' on an already-present item increments quantity, not a duplicate line
- **Failing test first** (`tests/homePageCart.test.js`): click Diavola's "Add to Order" twice;
  assert `#cart-line-items` still has exactly **one** `<li data-item-id="diavola">` whose text
  reflects quantity 2, and `#cart-badge` is `'2'`. Add a second, different item (Margherita) once;
  assert two distinct `<li>`s and `#cart-badge` is `'3'`.
- **Minimal code:** fix `addItem` in `cart.js` to look up by `id` first and increment `quantity`
  in place instead of always appending — this is the change this test drives, since AC4's minimal
  version only had to handle the fresh-item path.
- **Files:** modify `public/js/cart.js`, `tests/homePageCart.test.js`.

### AC6 — brand story section visible
- **Failing test first** (`tests/web.test.js`, `MT-STORY-026 AC6: brand story section`): body
  contains the `StorySection`: eyebrow "The Sourdough Secret" (green), title "Our Passion for the
  Perfect Crust", the description paragraph above, all 3 `FeatureItem`s ("100% Imported San
  Marzano Tomatoes", "Fior di Latte & Fresh Mozzarella", "900°F Stone Hearth Wood Oven" with their
  descriptions), and the two `StoryImageCollage` images.
- **Minimal code:** `StorySection` in `homePage.js` (`surface-warm` background, left-aligned
  `SectionHeading` without the underline rule, `FeatureList`/`FeatureItem` x3 with
  `star`/`shield`/`compass` icons, `StoryImageCollage` at `/images/story-dough.png` and
  `/images/story-oven.png`).
- **Files:** modify `src/views/pages/homePage.js`, `src/views/components/icon.js`; add 2 PNGs
  under `public/images/`; modify `tests/web.test.js`.

### AC7 — 'Explore Full Menu', 'Order Online Now', and 'Our Menu' all navigate to the menu page
- **Failing test first** (`tests/web.test.js`, `MT-STORY-026 AC7: navigation to the menu page`):
  `GET /` body's "Order Online Now" anchor, "Explore Full Menu" anchor, and the header's "Our
  Menu" `NavLink` anchor all have `href="/menu"`; then `GET /menu` → `200`, HTML content-type,
  body renders the shared `SiteHeader` with "Our Menu" as the active link and a recognizable page
  heading (e.g. "Our Menu").
- **Minimal code:** `src/views/pages/menuPage.js` — minimal stub composing
  `renderMarketingLayout` + `renderSiteHeader({ active: 'menu' })` + a placeholder body (heading
  only — full menu browsing/listing is a different story, not built here); `GET /menu` route in
  `src/routes/web.js`; `NavLinks` in `siteHeader.js` set `href="/menu"` for "Our Menu" and
  `href="#cart-panel"` for "Cart" (rendered per design, not functionally tested, per the
  duplicate-cart-entry-points note above).
- **Files:** create `src/views/pages/menuPage.js`; modify `src/routes/web.js`,
  `src/views/components/siteHeader.js`, `tests/web.test.js`.

## Test hygiene
- `tests/web.test.js` keeps its existing `beforeEach` (`userStore.reset()`, `emailService.reset()`)
  for the untouched `AC3`–`AC6` (registration/login) blocks; the new MT-STORY-026 blocks don't
  touch those stores, so no new reset is needed for them.
- `tests/homePageCart.test.js` uses `jest.isolateModules` (or an equivalent fresh-`require`) per
  test so `public/js/cart.js`'s module-scoped `cart` array never leaks state between tests.
- New describe blocks are labeled `MT-STORY-026 AC1`..`AC7` for traceability, matching this
  repo's existing convention.

## Out of scope (explicitly not built, per "stay within the ACs")
- **Footer** (`SiteFooter`, `FooterCol` hours/location, `SocialRow`, legal links) — present in the
  reviewed Figma frame but not referenced by any AC in this story.
- **Full menu-browsing page** — `GET /menu` is a minimal, real, navigable stub satisfying AC7's
  "navigated to the menu browsing page"; building out actual menu listing/search/filtering is a
  different story.
- **A real cart page/drawer design** — the `#cart-panel` popover is flagged above as
  implementation scaffolding built only from approved tokens, not a Figma-sourced component;
  a dedicated cart experience is a future story.
- **Cart persistence** — no localStorage/session/server storage; the cart is in-memory
  client-side state that resets on reload. No AC requires surviving a reload.
- **The "Cart" text `NavLink`'s behavior** — rendered per design, not wired or tested; only the
  `CartButton` badge/panel are exercised by AC4/AC5.
- **Login/registration UI relocation** — removing the forms from `/` (required by AC1's hero)
  leaves `POST /register`/`POST /login` reachable only by direct form submission with no linking
  page; no AC in this story asks for them to be rehomed, so this is left as-is and flagged, not
  silently patched over.
- **Geist font self-hosting/build tooling** — a CSS fallback stack is used instead (see above);
  no AC tests actual font-file loading.
