# MT-STORY-038 — Hero & primary ordering CTAs

## Conflict flagged for reviewer sign-off (read before the rest of this plan)
`GET /` currently renders `src/views/pages/homePage.js`, the **Facebook-branded** homepage
built for `MT-STORY-024` (Facebook wordmark, login card, registration card — see
`renderHomePage()`, `src/views/pages/homePage.js:1`). Its content is asserted by
`tests/web.test.js`'s `AC1: Facebook-branded homepage on load` and
`AC2: registration form visible on the homepage` describe blocks.

This story's approved design is a **different product**: "Forno Rosso", a pizzeria, whose
Figma frame is itself named `home-page` (`figma-frame.json` node `6:6`) and whose epic
("Marketing & Brand Landing") describes a full brand/ordering site with its own header/nav,
hero, delivery banner, pizza grid, brand-story section, and footer. Story AC1 says "GIVEN a
visitor loads **the home page**" — read literally and against the design, this must be
`GET /`, not a new route.

I cannot silently decide whether to (a) overwrite the previously-shipped, currently-tested
Facebook homepage at `/` with this new brand, or (b) leave `/` alone and put the new hero
somewhere else (which would contradict AC1's literal "home page" wording and the design's own
`home-page` frame name). **Resolution taken for this plan, flagging it rather than deciding
quietly:** treat this as an intentional pivot — `GET /` is repurposed to serve the new Forno
Rosso landing page, starting with just the Hero band this story requires (header/nav, delivery
banner, pizza grid, story section, footer are separate `component_map` entries under the same
epic, not this story's ACs, so they are **not** built here — the page will show only the dark
hero band after this story, which is expected incremental delivery). Concretely, this means:
- `tests/web.test.js`'s `AC1: Facebook-branded homepage on load` and
  `AC2: registration form visible on the homepage` blocks are **replaced** (they assert content
  that will no longer exist at `/`) — see the TDD breakdown below for the replacements.
- `AC3`–`AC6` in that same file (registration success/error, login success/error — all
  `POST /register` / `POST /login` response-body assertions) are **untouched**: those routes,
  their validators, and `feedPage.js`/`registrationErrorPage.js`/etc. are not touched by this
  story and keep passing as-is. Only their entry points (the login/registration cards that used
  to live on the homepage) disappear — there is no AC in this story asking to preserve them.
- `src/views/layout.js`'s shared `:root` design tokens (the Facebook palette: `--brand:
  #1877f2`, etc.) are **not** touched, so the untouched pages above keep rendering correctly.
  The new Hero styling is added as its own scoped block (see below) instead of overwriting the
  shared tokens, precisely so this pivot doesn't collaterally reskin pages outside this story.

**If this reading is wrong** (e.g. the Facebook homepage must stay at `/` and the pizzeria hero
belongs on a different route), say so and I'll rework the routing before touching any code.

## Design source (already approved — building, not designing)
`figma-frame.json` node `6:25` ("hero"), cropped at `.arc/designs/figma-section-6-25-hero.png`,
plus the reviewed `design-context.json` `component_map` entries for `6:25`–`6:39`. Exact values
read from the node tree (not guessed):
- **Section (`HeroSection`, node 6:25):** background `#151212` (`--surface-dark`), horizontal
  flex, `padding: 0 80px`, fixed desktop height 620px (content vertically centered), gap `48px`
  between the text column and the image.
- **Text column (`hero-text-container`, 6:26):** vertical stack, gap `32px`, width 616px (fills
  available space).
  - **Badge (6:27/6:29):** pill, `background: rgba(255,255,255,0.07)`, `border-radius: 100px`,
    padding `6px 12px`, gap `8px`; leading 16×16 icon (`fire-extinguisher`/flame glyph, 2px
    stroke, `#C82D25`); label "AUTHENTIC NEAPOLITAN WOODFIRED", Geist SemiBold 600 13px/16.9,
    uppercase, white.
  - **Heading (`Heading` level 1, 6:30):** Fraunces Bold 700, 64px/70.4 (110%), two-tone: "Wood-
    Fired Pizza, " in white (`#FFFFFF`), "Delivered Hot" in brand red (`#C82D25`) via a
    run-level style override — must render as `<h1>Wood-Fired Pizza, <span class="…highlight">
    Delivered Hot</span></h1>`, not a single flat string.
  - **Description (6:31):** Geist Regular 400, 18px/27 (150%), `color: rgba(255,255,255,0.8)`
    (this is the literal per-node opacity on 6:31, not the coarser `muted-on-dark: rgba(255,
    255,255,0.6)` bucket in the summarized tokens — using the exact node value since it's more
    specific to this text). Copy: "Baked at 900°F in our stone ovens to perfect charred
    perfection. Handcrafted sourdough bases fermented for 48 hours. Order now for fast, direct
    thermal-bag delivery."
  - **CTA group (6:32):** horizontal, gap `16px`.
    - **Primary button (6:33/6:34, "Order Online Now"):** `background: #C82D25`, `border-
      radius: 8px`, padding `16px 32px`, gap `8px` to a trailing 16×16 `arrow-right` icon (white,
      2px stroke); label Geist SemiBold 600 16px/20.8, white.
    - **Secondary button (6:36/6:37, "Explore Full Menu"):** transparent background, `1px solid
      #FFFFFF` border, `border-radius: 8px`, padding `16px 24px`, no icon; label Geist SemiBold
      600 16px/20.8, white.
  - **HeroImage (6:38/6:39):** 616×480, `border-radius: 24px`, `object-fit: cover`, source
    `.arc/designs/figma-asset-6-39-hero-image-wrapper.png` (wood-fired Margherita pizza).

## Open questions already resolved / not blocking this story
- `pizza-name-truncation`: about `PizzaCard`, not the hero — irrelevant here.
- `responsive-breakpoints` (non-blocking, `arc_assumption` in the design context): no
  tablet/mobile variant exists for this frame; the assumption on record is to build responsively
  with the existing spacing/type scale and conventional breakpoints. This plan follows that:
  one mobile breakpoint (see AC3 below) that stacks the hero and reuses the existing `40px`
  Fraunces size (already a token in `figma-frame.json` `tokens.font_sizes`, used elsewhere for
  section headings) for the headline, rather than inventing a new size.
- `font-hosting` (non-blocking): no bundler exists in this plain-Express app, so Fraunces
  (600/700) and Geist (400/500/600) are loaded via `<link>` tags to Google Fonts in
  `renderLayout`'s `<head>` — additive only, doesn't touch any existing page's `font-family`
  declarations.

## Files to create/modify
- `src/views/pages/homePage.js` — **rewrite**: replace the Facebook markup with the
  `hero-section` markup described above, passed to `renderLayout('Forno Rosso', body)`.
- `src/views/layout.js` — **modify**:
  - Add two Google Fonts `<link>` tags (Fraunces:wght@600;700, Geist:wght@400;500;600) to the
    `<head>` markup produced by `renderLayout`.
  - Append a new, self-contained CSS block scoped under `.hero-section` (its own local custom
    properties: `--hero-bg: #151212; --hero-fg: #fff; --hero-muted: rgba(255,255,255,.8);
    --hero-brand: #C82D25; --hero-badge-bg: rgba(255,255,255,.07);`) plus `.hero-badge`,
    `.hero-badge-icon`, `.hero-heading`, `.hero-heading-highlight`, `.hero-description`,
    `.hero-cta-group`, `.btn-hero-primary`, `.btn-hero-secondary`, `.hero-image-wrapper`,
    `.hero-image`, and one `@media (max-width: 640px)` block (AC3). This does **not** touch the
    existing `:root` tokens or `.btn*`/`.card`/`.app-shell` rules used by the other, untouched
    pages.
  - Remove the now-dead `.hero`, `.hero-copy`, `.hero-copy .brand-wordmark`, `.hero-copy p`
    rules and their `@media (max-width: 860px) { .hero { … } }` block — `homePage.js` was their
    only consumer and no longer uses them after the rewrite above.
- `src/views/pages/menuPage.js` — **new**: minimal stub page for AC2's navigation target
  (`<h1>Our Menu</h1>`, "Full menu coming soon." paragraph, a `.back-link` to `/`), rendered via
  `renderLayout('Forno Rosso — Menu', body)`.
- `src/routes/web.js` — **modify**: keep `GET /` wired to the rewritten `renderHomePage()`; add
  `router.get('/menu', (req, res) => res.type('html').send(renderMenuPage()));`.
- `src/app.js` — **modify**: add `app.use(express.static(path.join(__dirname, '..', 'public')))`
  so the hero image can be served.
- `public/images/hero-pizza.jpg` — **new**: the approved hero image asset, copied in from
  `.arc/designs/figma-asset-6-39-hero-image-wrapper.png` (binary copy, not authored content).
- `tests/web.test.js` — **modify**: replace the `AC1`/`AC2` describe blocks per the TDD
  breakdown below; leave `AC3`–`AC6` untouched.

## TDD task breakdown

### AC1 — hero renders headline, description, and both CTA buttons
- **Failing test first** (`tests/web.test.js`, replacing the old `AC1`/`AC2` describes with a
  new `describe('MT-STORY-038 AC1: hero section renders on home page load', ...)`): `GET /` →
  `200`, HTML content-type; body contains `class="hero-section"`; contains an `<h1
  class="hero-heading">` whose text includes "Wood-Fired Pizza," and a nested
  `<span class="hero-heading-highlight">Delivered Hot</span>`; contains the exact description
  paragraph text ("Baked at 900°F in our stone ovens to perfect charred perfection. Handcrafted
  sourdough bases fermented for 48 hours. Order now for fast, direct thermal-bag delivery.");
  contains an anchor with text "Order Online Now" and class `btn-hero-primary`; contains an
  anchor with text "Explore Full Menu" and class `btn-hero-secondary`; contains the badge text
  "AUTHENTIC NEAPOLITAN WOODFIRED" (part of the same approved Hero design, node `6:27`/`6:29`,
  even though not spelled out word-for-word in the AC).
- **Minimal code to pass:** rewrite `homePage.js` with the hero markup; add the `.hero-section`
  etc. CSS to `layout.js` per the "Design source" values above.
- **Files:** modify `src/views/pages/homePage.js`, `src/views/layout.js`, `tests/web.test.js`.

### AC2 — clicking either CTA navigates to the menu page (stub)
- **Failing test first** (same new describe block, or a sibling
  `describe('MT-STORY-038 AC2: hero CTAs navigate to the menu page', ...)`): assert the "Order
  Online Now" anchor and the "Explore Full Menu" anchor both have `href="/menu"`; add a second
  test, `GET /menu` → `200`, HTML content-type, body contains `<h1>Our Menu</h1>` and "Full menu
  coming soon.".
- **Minimal code to pass:** set both CTA anchors' `href` to `/menu` in `homePage.js`; create
  `menuPage.js`; add `GET /menu` to `web.js`.
- **Files:** create `src/views/pages/menuPage.js`; modify `src/views/pages/homePage.js`,
  `src/routes/web.js`, `tests/web.test.js`.

### AC3 — mobile viewport: headline, description, and both CTAs stay visible/legible, no horizontal scroll
**Testing-tool limitation, stated explicitly:** this repo only has Jest + Supertest (HTTP-level
response assertions) — there is no headless-browser/visual-regression tool (no Playwright,
Cypress, or jsdom-based layout engine) to actually render the page at a mobile viewport width
and check for overflow. The tests below can only verify that the *responsive CSS rules exist
and target the right elements/properties*; they cannot confirm the real rendered result. Manual
verification in an actual browser at a mobile width (e.g. browser devtools at 375×667) is
needed before calling AC3 done, and I'll do that pass once the code is in place, but it isn't a
substitute for an automated check and I'm flagging that gap rather than implying the Jest suite
proves the AC.
- **Failing test first** (`tests/web.test.js`, `describe('MT-STORY-038 AC3: hero is responsive
  on mobile viewports', ...)`): `GET /`, assert `res.text` contains an
  `@media (max-width: 640px)` block, and within it (string/regex checks against the `<style>`
  block) that: `.hero-section` switches to `flex-direction: column`, `.hero-cta-group` switches
  to `flex-direction: column` (so the two buttons stack instead of sitting side-by-side at
  ~427px combined width, which would overflow a ~375px viewport), and `.hero-heading` drops to
  `font-size: 40px` (reusing the existing 40px token from `figma-frame.json`'s
  `tokens.font_sizes`, used elsewhere for section headings, rather than a new value). Also
  assert — outside the media query, since it must hold at every width — that `.hero-image-
  wrapper` has `max-width: 100%` so the 616px-wide image asset never forces horizontal scroll on
  its own.
- **Minimal code to pass:** add the `@media (max-width: 640px)` block and the unconditional
  `.hero-image-wrapper { max-width: 100%; height: auto; }` (image inside uses `width: 100%;
  height: 100%; object-fit: cover;`) to the CSS added in AC1.
- **Files:** modify `src/views/layout.js`, `tests/web.test.js`.

## Out of scope (explicitly not built, per "stay within ACs")
- Header/nav (`Logo`, `NavBar`, `HeaderCartStatus`, `CartButton`), delivery banner, pizza
  card grid, brand-story section, and footer — all separate `component_map` entries under the
  same epic, not this story's ACs. The home page will show only the dark hero band after this
  story lands.
- A real `/menu` page — AC2 explicitly calls the destination "a stub/placeholder for this
  epic"; `menuPage.js` is intentionally minimal.
- Preserving the Facebook-clone login/registration UI anywhere else in the app now that it's
  removed from `/` — flagged above as part of the routing conflict; no AC in this story asks
  for it, and the underlying `POST /register`/`POST /login` endpoints and their own tests are
  untouched.
- Any change to `src/routes/registration.js`, `src/routes/login.js`, `src/routes/verification.js`,
  `src/routes/account.js`, their validators, stores, or tests.
- Real cart/menu ordering functionality, dynamic pricing, or any backend beyond the two static
  pages this story needs.
