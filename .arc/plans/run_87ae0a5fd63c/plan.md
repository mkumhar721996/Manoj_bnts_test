# MT-STORY-039 — Delivery promise banner

## Flagging the blocking open question, not silently resolving it
`design-context.json`'s `story-scope-full-page-vs-banner-only` question is recorded as
**`blocking: true`** and **`resolution.decision: "deferred"`** — i.e. still unresolved by the
reviewer, only defaulted by arc to `banner-only`. This plan builds to that same default
(`DeliveryPromiseBanner` + its children only — `DeliveryHighlight`, `IconBadge`, `StatGroup`,
`StatBlock`), because all three ACs talk only about "the banner" rendering on the home page, not
about the header/hero/featured-menu/story/footer sections also mapped in the design context.
**If the reviewer actually wants the full page (header→footer) shipped under this story, say so
and this plan will be redone** — that is a materially larger scope (5+ additional components)
that the current ACs do not ask for.

## Conflict with existing shipped code — flagging, not silently resolving
This repo's `/` route (`src/routes/web.js`, `src/views/pages/homePage.js`) already serves a
**completely different, already-shipped and tested** product: a "Facebook" sign-up/login demo
(`tests/web.test.js`, AC1–AC6 from MT-STORY-013/019/020/024), with its own design tokens baked
into `src/views/layout.js` (`--brand: #1877f2`, etc.). The Forno Rosso pizzeria design for this
story is an unrelated brand with its own token set (`--brand-green: #2A7043`, Fraunces/Geist,
etc.) that would collide with (or silently overwrite the meaning of) the existing `--brand`-style
tokens if merged into the same layout/CSS.

**Resolution taken** (same pattern as MT-STORY-024 used for its own dual-contract problem): serve
the Forno Rosso banner from a **new, separate route and layout**, `GET /forno-rosso`, with its own
`<style>` block containing only the Forno Rosso tokens this story needs — not touching
`src/routes/web.js`, `src/views/layout.js`, or any existing test. If the reviewer intended this
story's "home page" to *be* `/` (replacing the Facebook homepage), say so; as written, the two are
unrelated products sharing one repo, so they get separate routes.

## Design facts pulled from `figma-frame.json` (node `6:40`, `delivery-banner`)
- Node `6:40`: full-bleed frame, `x:-692 → width 1440, height 91`, `fills`/`backgroundColor` =
  `rgb(0.1647, 0.4392, 0.2627)` = **`#2A7043`** (confirms AC2 and the `brand-green` token exactly).
  `layoutMode: HORIZONTAL`, `primaryAxisAlignItems: SPACE_BETWEEN`, `counterAxisAlignItems: CENTER`,
  `paddingLeft/Right: 80`, `paddingTop/Bottom: 24` (spacing tokens `80` and `24`).
- Left side — `DeliveryHighlight` (`6:41`, `itemSpacing: 16`): `IconBadge` (`6:42`, 40×40,
  `cornerRadius: 20` i.e. `radius.full`/`radius.icon-badge`) whose fill is **white at 12.5%
  opacity** (`rgba(255,255,255,0.1254)`), not solid white — the component-map's "bg: white" prop is
  an approximation; the true fill matches the same translucent-white-badge pattern used elsewhere
  in the frame (e.g. `CartButton`'s 10%-opacity pill), so this plan reproduces it as
  `rgba(255,255,255,.125)`, not a flat white circle. Contains the `truck` icon (`6:571`, white
  2px stroke). Text stack (`6:44`, `itemSpacing: 2`): title `6:45` "Free Delivery On Orders Over
  $35" (Fraunces 18px/600, white), subtitle `6:46` "Craving quality? Skip the delivery fee
  entirely inside our active zones." (Geist 13px/400, white @ 90% opacity).
- Right side — `StatGroup` (`6:47`). **Its actual `itemSpacing` in the JSON is `32`, not the `64`
  claimed in the component-map's prose note** — trusting the geometry (JSON) over the prose per
  the stated precedence rules; gap between the two `StatBlock`s is implemented as `32`, a value
  already in the spacing scale.
  - `StatBlock` "Average ETA" (`6:48`, right-aligned, `itemSpacing: 2`): label `6:49` "Average ETA"
    (Geist 12px/400, white @ 80% opacity, `textCase: UPPER` — stored title-case, transformed via
    CSS `text-transform: uppercase`, per the token note), value `6:50` "25 - 35 Min" (Fraunces
    20px/700, white).
  - `StatBlock` "Pizza Temperature" (`6:51`, left-aligned): label `6:52` "Pizza Temperature"
    (same style as above), value `6:53` "Piping Hot Guaranteed" (Fraunces 20px/700, white).
- No mobile/narrow variant of this frame exists (per open question `no-responsive-breakpoints`) —
  the mobile layout AC3 asks for is not literally drawn anywhere in the design, so this plan
  assumes a single reasonable breakpoint (`640px`) that stacks the banner vertically, per that
  open question's already-recorded assumption.

## Testing-approach limitation (stated up front, not glossed over)
This repo's toolchain is Jest + Supertest only (`package.json`) — there is no headless-browser
tool (Puppeteer/Playwright) installed, and no prior story in this repo has added one. AC2
("background color... matches #2A7043") and AC3 ("fully visible... without truncation or
horizontal scrolling on a mobile viewport") describe *rendered/computed* behavior that a real
browser would verify (`getComputedStyle`, actual viewport layout). Without a browser engine, this
plan verifies the **source-level CSS rules that are the concrete implementation of** those
behaviors (the `.delivery-banner` rule literally paints `var(--brand-green)`, resolved to
`#2A7043`; no truncating/overflow styles exist on the three info pieces; a `max-width: 640px`
media query switches the banner to a single column so nothing needs to scroll). This is a
deliberate, disclosed proxy, not a claim that a real mobile browser has been used — call this out
if real device/viewport testing is required and a browser-automation dependency should be added.

## File layout
```
src/views/fornoRossoLayout.js            # new: renderFornoRossoLayout(title, bodyHtml) — own <style> block, Forno Rosso tokens only
src/views/components/deliveryPromiseBanner.js  # new: renderDeliveryPromiseBanner()
src/views/pages/fornoRossoHomePage.js    # new: renderFornoRossoHomePage() -> layout(banner)
src/routes/fornoRosso.js                 # new: GET /forno-rosso
src/app.js                               # modify: mount fornoRossoRouter
tests/fornoRossoHome.test.js             # new: AC1/AC2/AC3, one describe block per AC
```

## Design tokens carried into `fornoRossoLayout.js` (scoped to this story only)
```
--brand-green: #2A7043;
--color-white: #FFFFFF;
--font-display: 'Fraunces', serif;   /* display token */
--font-body: 'Geist', sans-serif;    /* body token */
--space-4: 16px;   --space-6: 24px;  --space-8: 32px;  --space-20: 80px;  /* from tokens.spacing */
--radius-full: 100px;                /* tokens.radius.full, used by icon-badge circle */
```
No other section's tokens (`ink`, `brand-red`, `bg-story`, `bg-page`, `card`/`hero-image` radii,
etc.) are pulled in — they belong to out-of-scope sections per the scoping decision above.

## TDD build order

### Step 1 — AC1: banner shows the free-delivery threshold, the ETA range, and the guarantee
- **Failing test first** (`tests/fornoRossoHome.test.js`, new file):
  ```js
  describe('AC1: delivery promise banner shows threshold, ETA range, and hot-guarantee', () => {
    it('renders all three promises on the home page', async () => {
      const res = await request(app).get('/forno-rosso');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Free Delivery On Orders Over $35');
      expect(res.text).toContain('25 - 35 Min');
      expect(res.text).toContain('Piping Hot Guaranteed');
    });
  });
  ```
- **Minimal code to pass:**
  - `src/views/components/deliveryPromiseBanner.js`: `renderDeliveryPromiseBanner()` returns the
    markup for node `6:40`'s subtree — `<section class="delivery-banner">` with
    `.delivery-highlight` (icon badge + title `6:45` + subtitle `6:46`) and `.stat-group`
    (two `.stat-block`s for `6:48`/`6:51` exactly as copied above). The truck icon is a small
    inline SVG (approximating vector `6:571`; exact path geometry isn't asserted by any AC).
  - `src/views/fornoRossoLayout.js`: `renderFornoRossoLayout(title, bodyHtml)` — same
    `<!DOCTYPE html>`/`<head>`/`<style>${STYLE}</style>` shape as `src/views/layout.js`, but with
    the token set listed above and only the `.delivery-banner`/`.delivery-highlight`/`.icon-badge`/
    `.stat-group`/`.stat-block`/`.stat-label`/`.stat-value` rules (desktop layout only for this
    step: `display:flex; justify-content:space-between; padding: 24px 80px; background:
    var(--brand-green);`, etc., matching the exact spacing/typography facts above).
  - `src/views/pages/fornoRossoHomePage.js`: `renderFornoRossoHomePage()` →
    `renderFornoRossoLayout('Forno Rosso', renderDeliveryPromiseBanner())`.
  - `src/routes/fornoRosso.js`: `router.get('/forno-rosso', (req, res) =>
    res.type('html').send(renderFornoRossoHomePage()))`.
  - `src/app.js`: `app.use('/', require('./routes/fornoRosso'))` alongside the existing
    `app.use('/', webRouter)` — different paths, no collision.
- **Files:** create all four `src/views/...`/`src/routes/fornoRosso.js` files and
  `tests/fornoRossoHome.test.js`; modify `src/app.js`.

### Step 2 — AC2: banner background matches design token `#2A7043`
- **Failing test first** (`tests/fornoRossoHome.test.js`):
  ```js
  describe('AC2: banner background matches the brand-green design token (#2A7043)', () => {
    it('paints the banner with --brand-green, defined as #2A7043', async () => {
      const res = await request(app).get('/forno-rosso');
      const style = res.text.match(/<style>([\s\S]*?)<\/style>/)[1];
      expect(style).toMatch(/--brand-green:\s*#2A7043\s*;/i);
      expect(res.text).toMatch(/<section[^>]*class="delivery-banner"/);
      const rule = style.match(/\.delivery-banner\s*{[^}]*}/)[0];
      expect(rule).toMatch(/background:\s*var\(--brand-green\)/);
    });
  });
  ```
- **Minimal code to pass:** ensure `fornoRossoLayout.js`'s `:root` defines
  `--brand-green: #2A7043;` and `.delivery-banner { background: var(--brand-green); ... }` (already
  written in Step 1's CSS if authored correctly — this step's job is to lock the exact hex/variable
  wiring with an explicit assertion so a future edit can't drift the color unnoticed).
- **Files:** modify `src/views/fornoRossoLayout.js` (only if Step 1's rule doesn't already match
  exactly), `tests/fornoRossoHome.test.js`.

### Step 3 — AC3: all three pieces of information stay fully visible on a mobile viewport
- **Failing tests first** (`tests/fornoRossoHome.test.js`):
  ```js
  describe('AC3: banner content stays fully visible on mobile, no truncation or horizontal scroll', () => {
    it('has no truncating/overflow styles on the highlight text or the stat values', async () => {
      const res = await request(app).get('/forno-rosso');
      const style = res.text.match(/<style>([\s\S]*?)<\/style>/)[1];
      for (const cls of ['delivery-highlight-title', 'delivery-highlight-subtitle', 'stat-label', 'stat-value']) {
        const rule = style.match(new RegExp(`\\.${cls}\\s*{[^}]*}`))[0];
        expect(rule).not.toMatch(/text-overflow|white-space:\s*nowrap|overflow:\s*hidden/);
      }
    });

    it('stacks into a single column under a mobile breakpoint instead of overflowing', async () => {
      const res = await request(app).get('/forno-rosso');
      const style = res.text.match(/<style>([\s\S]*?)<\/style>/)[1];
      expect(style).toContain('@media (max-width: 640px)');
      const mobileCss = style.slice(style.indexOf('@media (max-width: 640px)'));
      expect(mobileCss).toMatch(/\.delivery-banner\s*{[^}]*flex-direction:\s*column/);
      expect(mobileCss).toMatch(/\.stat-group\s*{[^}]*flex-wrap:\s*wrap/);
    });
  });
  ```
- **Minimal code to pass:** in `fornoRossoLayout.js`'s `<style>`, add
  `@media (max-width: 640px) { .delivery-banner { flex-direction: column; align-items: flex-start;
  padding: var(--space-6) var(--space-4); gap: var(--space-6); } .stat-group { flex-wrap: wrap;
  width: 100%; justify-content: space-between; } .stat-block--eta { align-items: flex-start; } }`
  and confirm none of `.delivery-highlight-title`/`.delivery-highlight-subtitle`/`.stat-label`/
  `.stat-value` ever set `white-space: nowrap`, `text-overflow`, or `overflow: hidden` (they
  shouldn't from Step 1, since nothing in the design calls for single-line clipping on this
  banner — unlike the separately-scoped `PizzaCard` title truncation, which lives in an
  out-of-scope section).
- **Files:** modify `src/views/fornoRossoLayout.js`, `tests/fornoRossoHome.test.js`.

## Test hygiene
- `tests/fornoRossoHome.test.js` needs no store/service reset (the banner is static content, no
  state) — no `beforeEach` required, unlike the Facebook-demo test files.
- Each `describe` block is labeled with its AC number (`AC1`/`AC2`/`AC3`), matching this repo's
  existing convention in `tests/web.test.js`.

## Out of scope (explicitly not built, per "stay within ACs" and the banner-only assumption)
- `SiteHeader`, `HeroSection`, `FeaturedMenuSection`/`PizzaCardGrid`, `StorySection`, `SiteFooter`,
  and every component mapped to them — pending the reviewer's answer to the still-`deferred`,
  blocking `story-scope-full-page-vs-banner-only` question.
- Exact vector artwork for the `truck` icon — approximated with a generic inline SVG; no AC tests
  the icon's shape.
- Real browser/viewport verification of AC2/AC3 — no headless-browser dependency exists in this
  repo; verified at the CSS-rule source level instead (see "Testing-approach limitation" above).
- Any change to `src/routes/web.js`, `src/views/layout.js`, `src/views/pages/homePage.js`, or their
  passing tests — the Facebook-demo product and its tests are untouched.
- Interactivity/links from the banner (e.g. no AC asks the delivery-fee copy or ETA to link
  anywhere) — pure static content matching the approved copy.
