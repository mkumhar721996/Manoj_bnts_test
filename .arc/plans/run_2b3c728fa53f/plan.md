# MT-STORY-041 — Brand story section

## Design source
Approved design context (summary JSON) + `.arc/designs/figma-section-6-108-story-section.png`
(read as an image) + `.arc/designs/figma-frame.json` nodes `6:108`–`6:135`. The section: warm
surface background, two-column layout — left column is a green eyebrow ("THE SOURDOUGH SECRET"),
a Fraunces 40px heading ("Our Passion for the Perfect Crust"), a muted body paragraph, and a
3-item feature list with red circular icon badges; right column is two 292×520 portrait photos
(16px radius, 16px gap) — left photo shows a pizzaiolo hand-stretching dough, right photo shows
a pizza baking inside a flaming wood oven. Exact copy pulled from the Figma node tree (not
paraphrased):
- Eyebrow (`6:111`): "The Sourdough Secret"
- Title (`6:112`): "Our Passion for the Perfect Crust"
- Body paragraph (`6:113`): "At Forno Rosso, we respect the traditions of Neapolitan
  pizzaiolos while implementing modern techniques. We ferment our proprietary sourdough
  mother starter for 48 hours. This process creates a light, bubbly, and incredibly
  digestible dough with complex flavor profiles."
- Feature 1 (`6:119`/`6:120`): "100% Imported San Marzano Tomatoes" / "Sourced directly from
  fertile Campania volcano soils for a sweet, low-acid base."
- Feature 2 (`6:125`/`6:126`): "Fior di Latte & Fresh Mozzarella" / "Hand-stretched daily,
  creating the classic pool texture that blends beautifully under high fire."
- Feature 3 (`6:130`? / description): "900°F Stone Hearth Wood Oven" / "Powered by seasoned
  hickory and oak to lock in flavors and produce perfect crust blistering in 90 seconds."

Note the intro paragraph (`6:113`) alone does **not** mention San Marzano tomatoes, mozzarella,
or the oven — AC2's "body copy referencing" those three things is satisfied by the feature-list
titles/descriptions directly beneath the paragraph, which is how the approved design actually
carries that content. Flagging this rather than inventing a rewritten paragraph that crams all
three references into prose the design doesn't show.

## Conflict flagged, not silently resolved: this "home page" is not the Forno Rosso page yet
`GET /` today renders `src/views/pages/homePage.js`, a **Facebook-branded** sign-up/login page
(`MT-STORY-013`/`MT-STORY-024`), styled by the Facebook-theme tokens in `src/views/layout.js`
(`--brand: #1877f2`, `--bg: #f0f2f5`, etc.). The approved design for this ticket is a completely
different brand (Forno Rosso pizzeria) and the design map explicitly scopes this ticket to just
the `BrandStorySection` (node `6:108`) region of that design, flagging the header/hero/featured
grid/footer as out of scope (open question `story-section-scope-vs-full-page`, `blocking: false`).
**Resolution taken**: append the new `BrandStorySection` as an additional `<section>` at the
bottom of the existing `renderHomePage()` output, using its own scoped CSS tokens (new
`--ink`/`--brand-green`/`--brand-red`/`--surface-warm`/`--border-hairline` custom properties
declared on the `.brand-story` selector, not overwriting the existing Facebook-theme root
variables of the same conceptual purpose). This satisfies "a visitor loads the home page ... the
brand story section renders" literally, without touching the unrelated existing header/hero/forms
or their passing tests. **If a full Forno Rosso home-page rebuild across all six regions is
intended instead, please say so** — that would be materially larger and is not what this ticket's
ACs or the flagged scope note ask for.

Two more gaps the design doesn't resolve, handled here explicitly:
- **No mobile artboard exists** for this frame (single 1440px desktop artboard). AC4 requires
  mobile legibility, so this plan reuses the same responsive strategy the codebase already
  applies to `.hero` (`src/views/layout.js:122`, a 860px breakpoint collapsing a two-column grid
  to one column) rather than inventing new breakpoint values.
- **No icon set exists in the codebase.** The three feature-list icon badges (star / shield /
  compass, `6:116`/`6:122`/`6:128`, 36×36 red circle radius 18) are built as small inline
  `aria-hidden="true"` SVGs approximating those glyphs. No AC tests icon shape, so fidelity here
  is not test-driven — it's the minimal way to match the design's visual composition.

## File layout
```
src/content/brandStory.js         # new: plain static content module (heading/eyebrow/paragraph/features/images)
public/images/story/dough-prep.png   # new: copy of .arc/designs/figma-asset-6-134-story-img-collage.png
public/images/story/wood-oven.png    # new: copy of .arc/designs/figma-asset-6-135-story-img-collage.png
src/app.js                        # modify: mount express.static for /images -> public/images
src/views/layout.js               # modify: add Fraunces/Geist font link + .brand-story CSS block
src/views/pages/homePage.js       # modify: append <section class="brand-story"> reading from brandStory.js
tests/web.test.js                 # modify: add MT-STORY-041 AC1-AC5 describe blocks
```

No new route is needed — `GET /` already renders `renderHomePage()` (`src/routes/web.js:20-22`).

## Content module shape (`src/content/brandStory.js`)
Plain, synchronous `module.exports` object literal — no database, no async fetch, no admin
route reads or writes it. This is the concrete mechanism satisfying AC5 ("static assets or
configuration ... requires no CMS or admin interface"):
```js
module.exports = {
  eyebrow: 'The Sourdough Secret',
  heading: 'Our Passion for the Perfect Crust',
  paragraph: 'At Forno Rosso, we respect the traditions of Neapolitan pizzaiolos while implementing modern techniques. We ferment our proprietary sourdough mother starter for 48 hours. This process creates a light, bubbly, and incredibly digestible dough with complex flavor profiles.',
  features: [
    { icon: 'star', title: '100% Imported San Marzano Tomatoes', description: 'Sourced directly from fertile Campania volcano soils for a sweet, low-acid base.' },
    { icon: 'shield', title: 'Fior di Latte & Fresh Mozzarella', description: 'Hand-stretched daily, creating the classic pool texture that blends beautifully under high fire.' },
    { icon: 'compass', title: '900°F Stone Hearth Wood Oven', description: 'Powered by seasoned hickory and oak to lock in flavors and produce perfect crust blistering in 90 seconds.' },
  ],
  images: [
    { src: '/images/story/dough-prep.png', alt: 'Pizzaiolo hand-stretching fresh sourdough at Forno Rosso' },
    { src: '/images/story/wood-oven.png', alt: 'Pizza baking inside the 900°F wood-fired oven' },
  ],
};
```

## Markup/CSS mapping to design tokens
- `<section class="brand-story">` — background `var(--surface-warm)` = `#F3EFE9` (node `6:108`).
- `.brand-story__grid` — two-column grid (content / images), reusing the same `860px` breakpoint
  as `.hero` to stack to one column on mobile (AC4).
- `.story-heading__eyebrow` — `eyebrow_label` type ramp (Geist, 600, 14px/18.2, uppercase),
  color `var(--brand-green)` = `#2A7043` (node `6:111`; this is the SectionHeading variant with a
  green eyebrow and no underline, left-aligned — distinct from the red/underlined/centered variant
  used by the featured-menu section, per the design's explicit note on node `6:110`).
- `.story-heading__title` — `section_h2` type ramp (Fraunces, 700, 40px/46), color `var(--ink)` =
  `#151212`.
- `.brand-story__body` — `body` type ramp (Geist, 400, 16px/25.6), color `var(--muted-story)` =
  `#6B6661` (scoped name to avoid clashing with the existing Facebook-theme `--muted: #65676b`).
- `.feature-list__icon` — 36×36 circle, `border-radius: 18px`, background `var(--brand-red)` =
  `#C82D25`, white icon glyph (nodes `6:116`/`6:122`/`6:128`).
- `.feature-list__title` — `feature_item_title` type ramp (Fraunces, 600, 16px/19.73), `var(--ink)`.
- `.feature-list__desc` — Geist, 400, 13px/18.2, `var(--muted-story)`.
- `.story-images` — flex/grid row, `gap: 16px`.
- `.story-images__photo` — `border-radius: 16px`, `width: 292px; height: 520px; object-fit: cover`
  on desktop; under the 860px breakpoint, `width: 100%; height: auto; max-width: 100%` so photos
  shrink instead of forcing horizontal scroll (AC4).
- Font families: add a `<link>` to Google Fonts for `Fraunces` (600/700) and `Geist` (400/600) in
  `renderLayout`'s `<head>`, and set `font-family: 'Fraunces', Georgia, serif` /
  `font-family: 'Geist', -apple-system, sans-serif` on the relevant `.brand-story` selectors only
  (not global — the rest of the page keeps `--font-sans` from the existing Facebook theme).

## Static image serving
`public/images/story/dough-prep.png` and `public/images/story/wood-oven.png` are plain copies of
the already-committed, approved design exports `.arc/designs/figma-asset-6-134-story-img-collage.png`
and `.arc/designs/figma-asset-6-135-story-img-collage.png`. `src/app.js` mounts
`app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')))` so `<img
src="/images/story/dough-prep.png">` resolves to a real file with no build step — the concrete
mechanism satisfying AC3 ("supporting photos are visible") and reinforcing AC5 (static file, no
CMS).

## TDD build order

### Step 1 — AC5: static content module, no CMS/admin dependency
- **Failing test first** (`tests/web.test.js`, new `describe('MT-STORY-041 AC5: ...')`):
  `require('../src/content/brandStory')` directly and assert its shape — `eyebrow`, `heading`,
  `paragraph` (containing `'At Forno Rosso'`), `features` (array of exactly 3, each with `icon`/
  `title`/`description`), `images` (array of exactly 2, each with `src`/`alt`). This is a plain
  `require` of a synchronous object literal — fails immediately with `Cannot find module` since
  the file doesn't exist yet.
- **Minimal code to pass:** create `src/content/brandStory.js` exactly as specified above.
- **Files:** create `src/content/brandStory.js`; modify `tests/web.test.js`.

### Step 2 — AC1: brand story heading renders on the home page
- **Failing test first** (`tests/web.test.js`, new `describe('MT-STORY-041 AC1: ...')`):
  `GET /` → `200`; `res.text` contains the exact heading markup
  `class="story-heading__title">Our Passion for the Perfect Crust<`.
- **Minimal code to pass:** in `src/views/pages/homePage.js`, import `brandStory` from
  `../../content/brandStory`, append a `<section class="brand-story">...<h2
  class="story-heading__title">${brandStory.heading}</h2>...</section>` block (with the eyebrow
  span above it) to the existing body template, inside the existing `renderLayout('Facebook',
  body)` call (title string is left as-is — no AC asks to change the `<title>`).
- **Files:** modify `src/views/pages/homePage.js`, `tests/web.test.js`.

### Step 3 — AC2: body copy references San Marzano tomatoes, fresh mozzarella, 900°F oven
- **Failing test first** (`tests/web.test.js`, new `describe('MT-STORY-041 AC2: ...')`): extend
  the `GET /` assertions — `res.text` contains `'San Marzano Tomatoes'`, `'Fresh Mozzarella'`, and
  `'900°F Stone Hearth Wood Oven'`.
- **Minimal code to pass:** render `brandStory.paragraph` in a `<p class="brand-story__body">`,
  and map `brandStory.features` into `.feature-list__item` blocks (icon badge + title +
  description) beneath it.
- **Files:** modify `src/views/pages/homePage.js`, `tests/web.test.js`.

### Step 4 — AC3: supporting photos are visible
- **Failing test first** (`tests/web.test.js`, new `describe('MT-STORY-041 AC3: ...')`):
  1. `GET /` → `res.text` contains two `<img class="story-images__photo" src="/images/story/dough-prep.png" alt="...">`-shaped tags (one per `brandStory.images` entry).
  2. `GET /images/story/dough-prep.png` and `GET /images/story/wood-oven.png` each → `200` with
     `content-type` matching `/image\//` (proves the files are actually served, not just
     referenced).
- **Minimal code to pass:** map `brandStory.images` into `<img>` tags inside `.story-images` in
  `homePage.js`; copy the two PNG design exports into `public/images/story/`; add
  `express.static` mount for `/images` in `src/app.js` (`const path = require('path');` +
  `app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')))`).
- **Files:** create `public/images/story/dough-prep.png`, `public/images/story/wood-oven.png`;
  modify `src/app.js`, `src/views/pages/homePage.js`, `tests/web.test.js`.

### Step 5 — AC4: mobile legibility, no horizontal scrolling
- **Failing test first** (`tests/web.test.js`, new `describe('MT-STORY-041 AC4: ...')`):
  `GET /` → `res.text` (which includes the inline `<style>` block) matches a `@media (max-width:
  860px)` rule that both (a) collapses `.brand-story__grid` to a single column and (b) sets
  `.story-images__photo` to `max-width: 100%` (fluid width instead of the fixed `292px` desktop
  width), e.g. asserted via two regexes: one for the media-query block containing
  `.brand-story__grid`, one for `.story-images__photo` containing `max-width: 100%`.
- **Minimal code to pass:** in `src/views/layout.js`, add the `.brand-story` rule block plus a
  `@media (max-width: 860px) { .brand-story__grid { grid-template-columns: 1fr; } .story-images__photo { width: 100%; height: auto; max-width: 100%; } }` block, following the same breakpoint
  already used by `.hero` (`layout.js:122-124`).
- **Files:** modify `src/views/layout.js`, `tests/web.test.js`.

### Step 6 — AC5 (integration half): renders the same way with no seeded/admin state
- **Failing test first** (`tests/web.test.js`, extend the `MT-STORY-041 AC5` describe from Step
  1): call `userStore.reset()`, then issue two separate `GET /` requests with nothing else set up
  (no login, no admin header/route, no seeded records) and assert both responses contain the
  identical brand-story heading/paragraph/feature text — demonstrating the section's content does
  not depend on any store, session, or admin-authored state.
- **Minimal code to pass:** none beyond Steps 1-3 — this step only adds the assertion that proves
  the existing static-module approach already satisfies it.
- **Files:** modify `tests/web.test.js`.

## Test hygiene
- New describe blocks are labeled `MT-STORY-041 AC1`..`AC5`, following the existing convention in
  `tests/web.test.js` (`MT-STORY-024`-labeled blocks already there are left untouched).
- No `beforeEach` changes needed beyond the existing `userStore.reset()`/`emailService.reset()` —
  the new section has no store dependency by design (AC5).

## Out of scope (explicitly not built, per "stay within ACs")
- No rebuild of the header, hero, delivery banner, featured-menu grid, or footer regions of the
  Forno Rosso design (`6:7`, `6:25`, `6:40`, `6:54`, `6:136`) — flagged above as a different
  ticket's scope per the design map's own open question.
- No change to the existing Facebook-branded header/hero/registration/login markup, CSS, or
  routes, and no change to their passing tests.
- No client-side JS/interactivity for the story section (no carousel, no scroll animation) — the
  design shows a static section and no AC asks for interactivity.
- No CMS, admin UI, or database-backed content editing for the story copy/images — AC5 explicitly
  rules this out; the plain `src/content/brandStory.js` module is the deliberate end state, not a
  placeholder for a future CMS integration.
- No pixel-perfect icon system — the three feature icons are minimal inline SVG approximations
  since no AC tests icon shape and no icon library exists in the codebase yet.
