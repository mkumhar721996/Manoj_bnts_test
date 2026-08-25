# MT-STORY-028 — Cart Item Management

## Design source
Read in full: `.arc/designs/design-context.json` (summarized in this session's context),
`.arc/designs/figma-frame.json` (node tree, queried for the cart-body subtree,
`13:263`–`13:374`), and the rendered crops `.arc/designs/figma-section-13-244-header.png` and
`.arc/designs/figma-section-13-263-cart-body.png`. `.arc/designs/MT-STORY-028-design.html` is
a Figma-mapping *review* page (reviewer bar, token swatches, open-question call-outs) — not an
interactive prototype and not shipped UI; it contributed no interaction pattern, only confirmed
the token values already in `design-context.json`.

Confirmed from the frame JSON (node `13:263`, "Your Selected Order" card + "Order Summary"
card):
- 3 seeded line items, each a single `characters` node holding **the line total, not a unit
  price**: Classic Margherita (variant "Neapolitan Woodfired", qty 2, `$29.00`), Diavola
  (variant "Neapolitan Woodfired", qty 1, `$16.50`), Rosemary Garlic Focaccia (variant
  "Neapolitan Woodfired", qty 1, `$8.50`). These sum exactly to the drawn Subtotal (`$54.00`),
  confirming they are line totals (unit price × quantity), e.g. Margherita's unit price is
  $14.50, not $29.00.
- Order Summary: Subtotal `$54.00`, Delivery Fee `FREE` (success-green), Oven Surcharge
  (Eco-box) `$1.50` flat, Sales Tax (8.5%) `$4.72` — verified as 8.5% of (subtotal + surcharge)
  = 8.5% × $55.50 = $4.7175 → rounds to $4.72 — Total `$60.22` = subtotal + surcharge + tax
  (delivery fee is $0).
- Header (`13:244`): dark `#151212` bar, `Logo` (circular vivid-red "F" badge + "Forno Rosso"
  Fraunces wordmark), `NavBar` (Home / Our Menu / Cart-active-with-underline), `HeaderCartCluster`
  ("Estimated delivery: 30 mins" + `CartIconButton` dark circle with a numeric badge, drawn as
  `3`).

## Flags — conflicts between the ACs and the approved design/design-context, called out rather than silently resolved

1. **AC1 requires a displayed "unit price" that the design never draws.** Every `CartLineItem`
   in the frame (`13:269`, `13:287`, `13:304`) shows exactly one price figure, and it's the line
   total (see above — the three figures sum to the Subtotal). There is no second price node
   anywhere in the row for a per-unit figure. Since AC1 explicitly says "displayed with its
   name, quantity, **unit price**, and line total" and the design is otherwise final, I'm adding
   one small caption per row rather than skipping AC1 or inventing a redesign: a muted
   (`#6B6661`), Geist, 13px caption — the same treatment already used for the "Neapolitan
   Woodfired" variant line and the "3 Items" card-header meta — reading e.g. `"$14.50 each"`,
   placed directly under the variant text. No new colour, font, or size is introduced; it reuses
   the frame's existing muted-caption token pairing. **Flagging for sign-off**: this text does
   not exist in the approved mock, it's the minimum addition to satisfy AC1's literal wording.

2. **AC3 contradicts this design context's own `stepper-min-boundary` assumption.** The design
   context's `arc_assumption` for that (blocking, `deferred`) open question is
   "`-` stays enabled at quantity 1 and decrementing past 1 removes the line item" — but AC3
   says the opposite: "the stepper's decrement control is **disabled** and the quantity remains
   at one." AC3 is the authoritative behavioural spec for this story, so this plan builds
   **disable-at-one**, not decrement-removes. There is no disabled-button visual anywhere in the
   frame's token set (flagged in the same open question), so the disabled state is built from
   existing tokens only: the `-` button keeps its shape/radius but drops to the muted text
   colour (`#6B6661`) on the existing white/`#F3EFE9`-ish stepper fill, plus the standard HTML
   `disabled` attribute (removes pointer/focus). **Flagging for sign-off**: no Figma node shows
   this state; it's derived, not traced.

3. **Scope split against the "Global Shell & Navigation" epic.** The ingested frame is one full
   page (header + cart body + footer), but this story's parent epic explicitly separates out
   "Global Shell & Navigation" (shared header/nav/footer/estimated-delivery, used across every
   screen) as its own concern — and the design context's own `shared-header-footer-scope` open
   question flags exactly this risk of duplicating work. Since no other screen/route exists yet
   in this codebase to link `NavBar`'s Home/Our Menu items to, and the estimated-delivery
   indicator and full `SiteFooter` aren't touched by any AC here, this plan builds only a
   **minimal, page-local header partial**: the dark bar, `Logo`, and `CartIconButton` (with its
   numeric badge) needed for AC4. `NavBar` (Home/Our Menu/Cart links), the estimated-delivery
   text, and the entire `SiteFooter` are **not built** in this story — flagged so the reviewer
   can confirm this split rather than having it decided silently.

4. **Delivery Destination card, Promo Code field, and "Proceed to Checkout" button are not
   built.** They're part of the same Figma frame but no AC in this story (reviewing items,
   changing quantity, removing items, empty state) touches delivery address entry, promo codes,
   or checkout. Building them now would be speculative work outside the ACs; they're called out
   explicitly rather than silently included or silently dropped. Same reasoning covers product
   images (`figma-asset-13-271/288/305-cart-left.png`) — no AC requires them, and rendering them
   would require adding static-file-serving middleware that doesn't currently exist in the app,
   for a purely decorative element no AC checks.

5. **Order Summary rows beyond Subtotal are still computed dynamically, not hardcoded.** AC2
   only names "the line total and order summary subtotal" as needing to update immediately.
   Delivery Fee/Oven Surcharge/Sales Tax/Total aren't mentioned. However, hardcoding them to the
   design's static sample values would make the page self-contradictory the moment a quantity
   changes (e.g. Total would stop matching Subtotal + Surcharge + Tax). Since all of them are
   produced by the same one small pricing function already needed for Subtotal, computing all
   of them together is not extra scope — it's using that same function's full return value
   instead of one field of it. This is the one place this plan does slightly more than AC2's
   literal wording, and it's called out here rather than silently expanded.

6. **Empty-cart state.** AC5 only asks that "an empty cart state is displayed." This plan
   follows the design context's own `assumed_option` (`simple-message`) for the blocking-but-
   deferred `empty-cart-state` question: the "Your Selected Order" card's row list is replaced
   with a plain "Your cart is empty." message when there are no items, matching-card-header
   count becomes "0 Items". No "Proceed to Checkout" disabling is built (that button isn't in
   scope at all per flag 4 above).

## Architecture
- **New, separate layout** — `src/views/cartLayout.js` (`renderCartLayout(title, bodyHtml)`),
  not the existing `src/views/layout.js`. That file's `STYLE` is the Facebook-brand design system
  from MT-STORY-013/019/020/024 (`--brand: #1877f2`, its own spacing/radius scale) used by
  `homePage.js`/`feedPage.js`/etc. — an unrelated product skin. This story's approved design is
  a different brand (Forno Rosso: `--ink:#151212`, `--vivid:#C82D25`, `--success:#2A7043`,
  `--muted:#6B6661`, `--page-bg:#FCFAF6`, Fraunces/Geist font families, this frame's own
  spacing/radii scale). Reusing the Facebook `STYLE` block would either clash or require
  bolting an unrelated token set into it, so the cart page gets its own `<style>` block sourced
  only from `design-context.json`'s `tokens` for this frame, containing only the classes this
  plan actually builds (header/badge, order card, line-item row, stepper, remove button, summary
  row/total row, empty state).
- **`src/store/cartStore.js`** (new) — in-memory line items, mirroring the existing
  `userStore.js` pattern (module-level array + `reset()` reseeding fixture data for test
  isolation). Each item: `{ id, name, variant, unitPriceCents, quantity }`. Prices are stored as
  integer cents (`1450`, `1650`, `850`) to avoid float rounding on the 8.5% tax calculation.
  Seed fixture = the design's 3 items (`classic-margherita` qty 2, `diavola` qty 1,
  `rosemary-garlic-focaccia` qty 1). Functions: `getItems()`, `incrementQuantity(id)`,
  `decrementQuantity(id)` (no-ops below quantity 1 — see flag 2), `removeItem(id)`, `reset()`.
- **`src/services/cartPricing.js`** (new) — pure function `computeSummary(items)` →
  `{ subtotalCents, deliveryFeeCents, surchargeCents, taxCents, totalCents }`. Constants:
  `OVEN_SURCHARGE_CENTS = 150`, `TAX_RATE = 0.085`, `DELIVERY_FEE_CENTS = 0`. Tax =
  `Math.round((subtotalCents + surchargeCents) * TAX_RATE)`. Reused for both the initial `GET
  /cart` render and every mutation response so the whole card always stays internally
  consistent (see flag 5).
- **`src/utils/currency.js`** (new) — `formatCents(cents)` → `"$54.00"` style string.
- **`src/views/pages/cartPage.js`** (new) — `renderCartPage(items, summary)`: header partial
  (Logo + `CartIconButton` badge = `items.length`, per the design context's own resolved
  `cart-badge-count-basis` assumption — also the only basis under which AC4's "decrements by
  one" is even true for an item whose quantity is 2), "Your Selected Order" card (title + "`N`
  Items" meta, then either the item rows or the flag-6 empty message), Order Summary card (all 5
  rows from `computeSummary`). Each item row: name, variant caption, new unit-price caption
  (flag 1), `QuantityStepper` (`-`/value/`+` as a 3-button/text mini-form, `-` disabled when
  `quantity === 1`, per flag 2), line total, `Remove` button/link. All interpolated item names
  reuse `src/utils/escapeHtml.js`, consistent with the rest of the codebase.
- **`src/routes/cart.js`** (new router), mounted at `/` in `src/app.js` alongside the existing
  routers (same pattern as `web.js` — a plain-HTML, non-`/api` surface):
  - `GET /cart` → renders the current store state.
  - `POST /cart/items/:itemId/increment` → `cartStore.incrementQuantity`, re-renders `200`.
  - `POST /cart/items/:itemId/decrement` → `cartStore.decrementQuantity` (clamped, flag 2),
    re-renders `200`.
  - `POST /cart/items/:itemId/remove` → `cartStore.removeItem`, re-renders `200`.
  All three mutation routes respond with the freshly rendered full page directly (no redirect),
  the same pattern `POST /register`/`POST /login` already use in `src/routes/web.js` — this is
  what makes "immediately" (AC2/AC3/AC4) testable with the project's existing `jest`+`supertest`
  stack, which has no browser/JS runner. Each `+`/`-`/`Remove` control is a plain
  `<form method="post">` button, consistent with the project having no client-side JS anywhere
  else (a genuinely async/AJAX stepper would need a testing tool this repo doesn't have).
- **`tests/cart.test.js`** (new), `beforeEach(() => cartStore.reset())`, following
  `tests/web.test.js`'s `describe('ACn: ...')` structure.

## TDD task breakdown

### AC1 — line item displayed with name, quantity, unit price, and line total
- **Failing test first** (`tests/cart.test.js`): `GET /cart` → `200`, HTML contains, for the
  seeded Margherita row: the name "Classic Margherita", quantity "2", unit price "$14.50", and
  line total "$29.00"; same shape asserted for Diavola ("$16.50" unit price and line total,
  since qty 1) and Rosemary Garlic Focaccia ("$8.50"/"$8.50").
- **Minimal code**: `src/store/cartStore.js` (seed fixture), `src/utils/currency.js`,
  `src/services/cartPricing.js`, `src/views/cartLayout.js`, `src/views/pages/cartPage.js`
  (name/variant/unit-price caption/quantity/line-total markup only — stepper buttons and Remove
  come with AC2–4), `src/routes/cart.js` (`GET /cart` only), mount in `src/app.js`.
- **Files**: create all of the above plus `tests/cart.test.js`; modify `src/app.js`.

### AC2 — changing quantity via the stepper updates line total and subtotal immediately
- **Failing test first** (`tests/cart.test.js`): `POST /cart/items/classic-margherita/increment`
  → `200`, body's Margherita row now shows quantity "3" and line total "$43.50", and the Order
  Summary's Subtotal now reads "$68.50" (54.00 + 14.50) in the same response body (no second
  request).
- **Minimal code**: `QuantityStepper` `+`/`-` forms in `cartPage.js`, `incrementQuantity` in
  `cartStore.js`, the `POST /cart/items/:itemId/increment` handler in `cart.js` that mutates the
  store and re-renders via the same `computeSummary`/`renderCartPage` used by `GET /cart`.
- **Files**: modify `src/store/cartStore.js`, `src/views/pages/cartPage.js`, `src/routes/cart.js`,
  `tests/cart.test.js`.

### AC3 — decrement control disabled at quantity 1; quantity stays at 1
- **Failing test first** (`tests/cart.test.js`), two cases: (a) `GET /cart` → the Diavola row's
  `-` button carries the `disabled` attribute (regex/string match on that button's markup),
  while the Margherita row's `-` (qty 2) does not; (b) `POST
  /cart/items/diavola/decrement` (exercising the endpoint directly, since a real `disabled`
  button can't be "clicked" in an HTTP-level test) → `200`, Diavola's quantity is still "1" and
  its `-` button is still rendered `disabled` in the response.
- **Minimal code**: `decrementQuantity` in `cartStore.js` no-ops when quantity is already 1;
  `cartPage.js` renders `disabled` on the `-` button whenever `quantity === 1` (muted-colour
  styling per flag 2); `POST /cart/items/:itemId/decrement` handler in `cart.js`.
- **Files**: modify `src/store/cartStore.js`, `src/views/pages/cartPage.js`, `src/routes/cart.js`,
  `tests/cart.test.js`.

### AC4 — removing a line item hides its row and decrements the header badge by one
- **Failing test first** (`tests/cart.test.js`): starting from the 3-item seed (header badge
  "3"), `POST /cart/items/classic-margherita/remove` → `200`, body no longer contains "Classic
  Margherita" anywhere, the "Your Selected Order" meta now reads "2 Items", and the header
  `CartIconButton` badge now reads "2".
- **Minimal code**: `removeItem` in `cartStore.js`; `Remove` button/form per row in
  `cartPage.js`; `POST /cart/items/:itemId/remove` handler in `cart.js`; header badge markup
  driven by `items.length` (already wired for AC1, just exercised here for the mutating path).
- **Files**: modify `src/store/cartStore.js`, `src/views/pages/cartPage.js`, `src/routes/cart.js`,
  `tests/cart.test.js`.

### AC5 — empty cart shows an empty state
- **Failing test first** (`tests/cart.test.js`): remove all 3 seeded items via three sequential
  `POST .../remove` calls (or seed the store directly to `[]` via a test-only path through
  `cartStore.reset()`/direct mutation, whichever keeps the test simplest), then `GET /cart` →
  `200`, body contains "Your cart is empty." in place of any item row, "0 Items" in the card
  meta, Subtotal/Total both "$0.00", and the header badge reads "0".
- **Minimal code**: `cartPage.js` branches to the flag-6 empty message when `items.length === 0`;
  `computeSummary([])` naturally yields all-zero totals with no special-casing needed.
- **Files**: modify `src/views/pages/cartPage.js`, `tests/cart.test.js`.

## Out of scope (explicitly not built, per flags above and "stay within ACs")
- `NavBar` (Home/Our Menu/Cart links) and the "Estimated delivery: 30 mins" indicator — belong
  to the "Global Shell & Navigation" epic (flag 3).
- `SiteFooter` in its entirety (flag 3).
- `Delivery Destination` card/form, `PromoCodeField` (all its states — default/applied/error),
  and the "Proceed to Checkout" button — no AC in this story touches them (flag 4).
- Product images (`figma-asset-13-271/288/305-cart-left.png`) and any static-file-serving setup
  they'd require — no AC requires them (flag 4).
- No client-side JS/AJAX — quantity/remove controls are plain `<form method="post">` submissions
  re-rendering the full page server-side, consistent with the rest of this codebase and
  necessary for testability with the project's existing `jest`+`supertest` stack (see
  Architecture).
- No persistence beyond the module-level in-memory `cartStore` (matches `userStore`'s existing
  pattern) — no AC asks for cross-restart persistence, multi-user carts, or auth/session scoping.
