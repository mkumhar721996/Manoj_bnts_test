# MT-STORY-042 — Site footer & business info

## Context / codebase reality check
This repository's existing code (`src/app.js`, `src/routes/*`, `src/views/*`) is a **completely
unrelated** "Facebook-clone" demo built for prior stories (MT-STORY-013/019/020/024): `GET /`,
`POST /register`, `POST /login` under `webRouter`, plus a JSON API under `/api/*`, all styled by
`src/views/layout.js`'s own design tokens (`--brand: #1877f2`, etc.) and covered by
`tests/*.test.js`. None of that code, none of its routes, and none of its design tokens have
anything to do with this story's epic (**Marketing & Brand Landing** for the "Forno Rosso"
pizzeria). Nothing for the pizzeria site exists yet — no header, hero, delivery banner, featured
grid, story section, or footer. `grep`-ing `src/` for `footer|Forno|pizzeria|kitchen hours` returns
nothing.

This plan builds **only the footer** (this story's scope), as its own new route/page, without
touching or risking the existing, tested Facebook-clone routes.

## Design source (re-verified against `.arc/designs/figma-frame.json` and
`.arc/designs/figma-section-6-136-footer.png`)
Footer = Figma node `6:136`, dark `#151212` ("ink" token) full-width band, `80px` side padding,
`80px` top / `48px` bottom padding, children left-to-right: `FooterBrand` (`6:138`), `FooterColumn`
"Kitchen Hours" (`6:151`), `FooterColumn` "Pizzeria Location" (`6:163`), then a full-width
`Divider` (`6:170`), then `FooterBottom` (`6:171`: copyright left, legal links right). Exact copy
and typography, read node-by-node from `figma-frame.json` (more precise than the summary notes
where the two disagree — the JSON is the measured source):
- **Brand mark**: `BrandLogo` (`6:139`–`6:142`), reused verbatim from the header spec at half the
  header's size — 36×36 circular badge, `background: #C82D25` (`brand-red` token,
  `cornerRadius: 18`), containing "F" in Fraunces Bold Italic 700/18px, white; wordmark "Forno
  Rosso" in Fraunces SemiBold 600, white, next to the badge.
- **Brand blurb** (`6:143`): "Artisanal wood-fired sourdough pizzas crafted with 48-hour fermented
  dough and imported San Marzano ingredients. Delivered fresh and piping hot." — Geist 400/14px,
  line-height 21px, white at 60% opacity.
- **Social row** (`6:144`): 3× `SocialIconLink` (`6:145` instagram, `6:147` facebook, `6:149`
  twitter) — each a 36×36 circle, `background: rgba(255,255,255,0.07)` (same translucent-white
  fill used by the hero badge pill), `cornerRadius: 18`, containing an 18×18 outline icon (2px
  white stroke, round caps).
- **"Kitchen Hours" / "Pizzeria Location" headings** (`6:152`, `6:164`): Fraunces SemiBold
  600/16px, white, **`textCase: UPPER`** in the JSON (design's `footer-heading` ramp doesn't call
  this out, but both heading nodes explicitly set it) — render as visually uppercase via CSS
  `text-transform: uppercase`, while the underlying text/DOM content stays "Kitchen Hours" /
  "Pizzeria Location" (so tests can assert on the natural-case string).
- **Kitchen Hours rows** (`6:154`/`6:155`–`6:156`, `6:157`/`6:158`–`6:159`, `6:160`/`6:161`–`6:162`):
  label Geist 400/14px white 100%, value Geist 400/12px white 60% opacity, each pair:
  - "Monday - Thursday" / "12:00 PM - 10:00 PM"
  - "Friday - Saturday" / "12:00 PM - 11:30 PM"
  - "Sunday" / "1:00 PM - 9:30 PM"
- **Pizzeria Location body** (`6:165`–`6:169`): address "842 Rione Monti, Sourdough Avenue, Suite
  100" (Geist 400/14px, white 60%), then "Delivery: (555) 392-7677" and "Email:
  ciao@fornorosso.pizza" (Geist 400/14px, white 100%, no muted opacity on these two lines).
- **Divider** (`6:170`): full-width 1px line, `rgba(255,255,255,0.12)`.
- **Footer bottom** (`6:171`–`6:175`): "© 2026 Forno Rosso Pizzeria. All rights reserved." left
  (Geist 400/12px, white 60%); "Privacy Policy" and "Delivery Terms" right (Geist 400/12px, white
  60% each).

No hex/URLs are given anywhere in the design for the 3 social icons or the 2 legal links (open
question `social-link-destinations`, `arc_assumption`: placeholder `href="#"`). See "Decisions to
flag" below for how this plan treats that differently for legal links vs. social icons, per AC4's
literal wording.

## Scope / architecture decisions to flag for reviewer sign-off
1. **New, isolated route, not `/`.** The existing `GET /` already serves the unrelated
   Facebook-clone homepage (`tests/web.test.js` asserts Facebook branding there) — this plan does
   not touch it. The pizzeria site is mounted at a new prefix, **`/pizzeria`**, via a new
   `src/routes/marketingSite.js` router, with its own layout/stylesheet
   (`src/views/marketingSite/layout.js`) carrying the Forno Rosso tokens (`ink`, `brand-red`,
   `brand-green`, `muted`, `surface-page`, `on-dark`, `border-hairline`, `Fraunces`/`Geist` fonts)
   — kept completely separate from `src/views/layout.js`'s Facebook tokens so the two design
   systems never bleed into each other. **The exact path name (`/pizzeria`) is this plan's choice,
   not something the design/ACs specify — flagging for confirmation/rename before merge.**
2. **Only the footer is built.** Every other pizzeria section (header, hero, delivery banner,
   featured grid, story section) is marked `proposed_new` for *future* stories in the component
   map, not this one. So `GET /pizzeria` for now renders an empty `<main>` landmark plus the
   footer — satisfying AC1's "any page loads → footer renders" with the one page that exists today.
   Future stories will fill in `<main>` and can reuse `src/views/marketingSite/layout.js`.
3. **Legal links get real stub pages; social icons stay `href="#"`.** AC4 says legal links must
   "navigate to the appropriate legal page (destination may be a stub/placeholder)" — a bare `#`
   anchor doesn't navigate anywhere, so it doesn't satisfy AC4 as literally written. This plan
   overrides the recorded `href="#"` assumption **for the legal links only**: two minimal stub
   pages/routes are built (`GET /pizzeria/privacy-policy`, `GET /pizzeria/delivery-terms`), and the
   footer's legal-link hrefs point at them. Social icons have no equivalent AC requiring a working
   destination (AC3 only requires the `target="_blank"` mechanism), so they keep the recorded
   `href="#"` placeholder.
4. **AC5 (mobile, no horizontal scroll) has no browser-based test tool in this stack.** The repo
   only has Jest + Supertest (HTTP/HTML-string assertions), no Playwright/Puppeteer/visual-diff
   tool, and adding one is a bigger cross-cutting change out of scope for a footer story. The
   test for AC5 asserts the emitted `<style>` block contains the responsive rules (a breakpoint
   media query that stacks the footer's columns and reduces its padding) as a **proxy** for actual
   rendered behavior — this is a real limitation, not a false claim of full coverage; a manual
   check in a mobile emulator is recommended before calling AC5 done.
5. **No breakpoint value is specified** (the Figma frame is a single 1440px-wide artboard — see
   the already-recorded, non-blocking open question `no-responsive-layout-provided`). This plan
   picks **680px** as the stack point; flagging as a value a human should confirm, consistent with
   that open question's own note.

## Static configuration (AC2 / AC6)
New `src/config/businessInfo.js`, a single frozen object that is the one source of truth for every
piece of footer copy — both to satisfy AC2 ("all displayed information matches the values defined
in the static configuration") and AC6 ("served from static assets/configuration, no admin/CMS"):
```js
{
  brand: { mark: 'F', name: 'Forno Rosso', blurb: '...' },
  socialLinks: [{ platform: 'instagram', href: '#' }, { platform: 'facebook', href: '#' }, { platform: 'twitter', href: '#' }],
  kitchenHours: [{ label: 'Monday - Thursday', value: '12:00 PM - 10:00 PM' }, ...],
  location: { address: '842 Rione Monti, Sourdough Avenue, Suite 100', deliveryPhone: '(555) 392-7677', deliveryEmail: 'ciao@fornorosso.pizza' },
  legalLinks: [{ label: 'Privacy Policy', href: '/pizzeria/privacy-policy' }, { label: 'Delivery Terms', href: '/pizzeria/delivery-terms' }],
  copyright: '© 2026 Forno Rosso Pizzeria. All rights reserved.',
}
```
`Object.freeze`d (and each array frozen too) so it's structurally impossible to mutate at runtime —
the concrete, testable form of "no admin/CMS interface" for AC6.

## File layout
```
src/config/businessInfo.js                       # new: frozen static content (AC2/AC6)
src/views/marketingSite/layout.js                 # new: HTML shell + Forno Rosso tokens/CSS incl. footer + responsive rules
src/views/marketingSite/components/siteFooter.js  # new: renderSiteFooter() — pure function of businessInfo
src/views/marketingSite/pages/homePage.js         # new: renderHomePage() — empty <main> + footer
src/views/marketingSite/pages/legalStubPage.js    # new: renderLegalStubPage(title) — minimal stub page
src/routes/marketingSite.js                       # new: GET /pizzeria, GET /pizzeria/privacy-policy, GET /pizzeria/delivery-terms
src/app.js                                        # modify: mount marketingSiteRouter
tests/marketingSiteFooter.test.js                 # new: one describe block per AC
```

## TDD build order

### AC1 — footer displays brand blurb, social links, kitchen hours, address, delivery phone, delivery email, and legal links
- **Failing test first** (`tests/marketingSiteFooter.test.js`, new file): `GET /pizzeria` → `200`,
  HTML content type, body contains: the brand blurb text, three social-icon anchors (one per
  platform, e.g. via `class="social-icon-link social-icon-link--instagram"` or an `aria-label`),
  the "Kitchen Hours" heading plus all three day/time pairs, the "Pizzeria Location" heading plus
  the address, "Delivery: (555) 392-7677", "Email: ciao@fornorosso.pizza", and both "Privacy
  Policy" / "Delivery Terms" legal links.
- **Minimal code**: `src/config/businessInfo.js` (full object above); `siteFooter.js` rendering
  the markup structure from "Design source" above, reading every value from `businessInfo`;
  `layout.js` (HTML shell + `<style>` with the footer's CSS — dark `ink` background, badge/wordmark,
  three-column row with `64px` gap, divider, bottom bar — plus `<link>` tags for the Fraunces and
  Geist Google Fonts, since neither is loaded anywhere else in this repo); `homePage.js` (empty
  `<main>` + `renderSiteFooter()`); `src/routes/marketingSite.js` (`GET /pizzeria`); mount in
  `src/app.js`.
- **Files**: create `src/config/businessInfo.js`, `src/views/marketingSite/layout.js`,
  `src/views/marketingSite/components/siteFooter.js`, `src/views/marketingSite/pages/homePage.js`,
  `src/routes/marketingSite.js`, `tests/marketingSiteFooter.test.js`; modify `src/app.js`.

### AC2 — all displayed footer information matches the static configuration values
- **Failing test first**: rewrite the AC1 assertions to reference `businessInfo.*` fields (imported
  from `src/config/businessInfo.js`) instead of literal duplicated strings, e.g.
  `expect(res.text).toContain(businessInfo.brand.blurb)`, looping `businessInfo.kitchenHours` and
  `businessInfo.legalLinks` to assert each label/value/href pair appears — so the test fails if the
  footer ever hardcodes a value that drifts from config, not just if the current copy is wrong.
- **Minimal code**: none expected beyond AC1's, since `siteFooter.js` already reads from
  `businessInfo` — this step only tightens the test's source of truth. If any literal string is
  still hardcoded in `siteFooter.js` after AC1, replace it with the corresponding `businessInfo`
  field.
- **Files**: modify `tests/marketingSiteFooter.test.js` (and `siteFooter.js` only if needed).

### AC3 — clicking a social media link opens it in a new browser tab
- **Failing test first**: for each of the 3 social anchors, assert the tag has
  `target="_blank"` and `rel="noopener noreferrer"` (the latter for the well-known
  `target="_blank"`-without-`rel` reverse-tabnabbing issue — a correctness/security default, not
  scope creep), and that `href` equals `businessInfo.socialLinks[i].href`.
- **Minimal code**: add `target="_blank" rel="noopener noreferrer"` to each social `<a>` in
  `siteFooter.js`.
- **Files**: modify `src/views/marketingSite/components/siteFooter.js`, test file.

### AC4 — clicking a legal link navigates to the (stub) legal page
- **Failing test first**: (a) assert each legal anchor's `href` equals
  `businessInfo.legalLinks[i].href` (i.e. `/pizzeria/privacy-policy`, `/pizzeria/delivery-terms`);
  (b) `GET` each of those two paths directly → `200`, HTML, body contains the matching link label
  as a heading (e.g. "Privacy Policy") and an explicit placeholder statement (e.g. "This page is a
  placeholder.").
- **Minimal code**: `src/views/marketingSite/pages/legalStubPage.js` (`renderLegalStubPage(title)`);
  two routes in `src/routes/marketingSite.js` (`GET /pizzeria/privacy-policy`,
  `GET /pizzeria/delivery-terms`) rendering that stub with the right title; `businessInfo.js`'s
  `legalLinks` hrefs set to those two paths (see "Decisions to flag" #3 above — this deliberately
  does not use the recorded `href="#"` assumption for these two links).
- **Files**: create `src/views/marketingSite/pages/legalStubPage.js`; modify
  `src/config/businessInfo.js`, `src/routes/marketingSite.js`, test file.

### AC5 — footer is fully visible/legible on a mobile viewport with no horizontal scroll
- **Failing test first**: assert the layout's emitted `<style>` string contains: a
  `@media (max-width: 680px)` block; inside it, the footer's three-column row (brand + Kitchen
  Hours + Pizzeria Location) switching to a single stacked column (`flex-direction: column` or
  `grid-template-columns: 1fr`); the bottom bar (copyright + legal links) also stacking/wrapping;
  and the footer's side padding reduced from the desktop `80px` to a smaller mobile value. Also
  assert the global stylesheet sets `box-sizing: border-box` and the footer container has no fixed
  pixel `width` (only `width: 100%`/fluid units), so padding can never push it wider than the
  viewport. *(Per "Decisions to flag" #4, these are string-level proxies for the real requirement —
  there is no headless-browser check in this stack.)*
- **Minimal code**: in `layout.js`'s CSS — `* { box-sizing: border-box; }`; `.site-footer` at
  `width: 100%`, `padding: 80px`; `.site-footer__top` as a flex row, `gap: 64px`,
  `flex-wrap: wrap`; `.site-footer__bottom` as a flex row, `justify-content: space-between`; then
  `@media (max-width: 680px) { .site-footer { padding: 32px 20px; } .site-footer__top { flex-direction: column; gap: 32px; } .site-footer__bottom { flex-direction: column; align-items: flex-start; gap: 12px; } }`.
- **Files**: modify `src/views/marketingSite/layout.js`, test file.

### AC6 — footer content is static config/assets, no admin/CMS required
- **Failing test first**: (a) `Object.isFrozen(businessInfo)` is `true` (and
  `Object.isFrozen(businessInfo.kitchenHours)` etc. for the nested arrays) — the concrete,
  testable form of "no interface can edit this at runtime"; (b) two consecutive `GET /pizzeria`
  calls return byte-identical footer markup, showing the response isn't reading from any mutable
  per-request source.
- **Minimal code**: `Object.freeze()` the top-level object and every nested array/object literal in
  `src/config/businessInfo.js`.
- **Files**: modify `src/config/businessInfo.js`, test file.

## Out of scope (explicitly not built, per "stay within this story's ACs")
- Header, hero, delivery banner, featured menu grid, story section — all separately-scoped,
  `proposed_new` future stories in the same epic; `GET /pizzeria`'s `<main>` stays empty.
- Real destination URLs for the 3 social icons — no such data exists anywhere in the design or
  business info; kept as `href="#"` per the recorded open question, revisit in a follow-up story
  once real handles are supplied.
- Any visual/pixel-perfect regression testing — this stack has no screenshot/visual-diff tool;
  AC5 is covered by CSS-rule presence assertions only (see "Decisions to flag" #4).
- Any change to the existing Facebook-clone routes, views, or tests (`src/routes/web.js`,
  `src/views/layout.js`, `src/views/pages/*`, `tests/web.test.js`, etc.) — untouched.
- Session/auth/cart/ordering functionality implied elsewhere in the Figma frame (header's cart,
  hero's CTAs) — no AC in this story touches them.
