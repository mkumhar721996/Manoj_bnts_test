# MT-STORY-029 — Promo Code Application

## Codebase context
This repo (`mt-story-013-user-facebook` / "Manoj_demo") is a small Express app with **no
templating engine** — pages are plain HTML-string view functions (`src/views/pages/*.js`)
wrapped by `src/views/layout.js#renderLayout(title, bodyHtml)`, routed by per-feature routers
in `src/routes/*.js` mounted in `src/app.js`, backed by tiny in-memory stores
(`src/store/*.js`, each with a `reset()` used from `beforeEach` in tests). Tests are
Jest + Supertest, one file per route surface (`tests/*.test.js`), asserting on `res.text`
substrings/regexes against the rendered HTML, mirroring `tests/web.test.js`. There is
**no cart, order, or promo code code at all yet** — this is greenfield for this story, built
the same way `web.js`/`homePage.js`/`feedPage.js` were for MT-STORY-024 (plain
`method="post"` forms, server-rendered response, no client JS, no session/auth wiring).

The approved design (`.arc/designs/design-context.json`, `figma-frame.json`,
`figma-section-13-263-cart-body.png`, `figma-section-13-244-header.png`) is for a *different*
fictional product ("Forno Rosso" pizzeria) than the existing Facebook-style pages in this repo.
That's expected — this story stands up its own route/page, `GET /cart`, independent of
`web.js`'s home/register/login/feed pages, the same way `web.js` itself was added alongside the
pre-existing `/api/*` routers without touching them.

## Design facts pulled from the raw Figma export (not just the summary JSON)
I read `figma-frame.json` around nodes `13:344`–`13:371` (Order Summary card) and viewed
`figma-section-13-263-cart-body.png` directly. Confirmed order-summary line items in the single
drawn state are exactly, top to bottom: **Subtotal `$54.00`**, **Delivery Fee `FREE`** (green),
**Oven Surcharge (Eco-box) `$1.50`**, **Sales Tax (8.5%) `$4.72`**, then a visually-separated
**Total `$60.22`** row (Fraunces 16/600 label, brand-red Geist 22/700 value) — `54.00 + 1.50 +
4.72 = 60.22` (delivery is `$0`). Below that: the `PROMO CODE` field, already showing the
**applied** state (`FORNOROSSO10`, green border/text, check-circle icon, solid-green "Applied"
pill), then the full-width red "Proceed to Checkout" button.

## Two gaps between the frozen design and the ACs — flagging explicitly, not silently resolving
1. **No discount line, and Total doesn't subtract anything, even in the drawn "applied" state**
   (confirmed above: `$60.22 = $54.00 + $1.50 + $4.72`, no discount term anywhere). AC3
   explicitly requires "the subtotal, discount line, and final total are all visible and the
   final total equals the subtotal minus the discount amount" — this is impossible to satisfy
   pixel-faithfully because the frame has no discount row. **Resolution**: extend the existing
   `SummaryLineItem` pattern (already reused 4x for Subtotal/Delivery Fee/Oven
   Surcharge/Sales Tax, per `design-context.json`'s `component_map`) with one more instance,
   label `Discount`, value styled like the "FREE" delivery text (`var(--success)`, Geist
   14/600), rendered only when a promo is applied, positioned directly under `Subtotal`. Total
   becomes `subtotal - discount + deliveryFee + ovenSurcharge + salesTax`; delivery/surcharge/tax
   are **not** recomputed against the discounted subtotal (they stay pinned to the values the
   design already fixed at `$0`/`$1.50`/`$4.72`), so the only thing a promo changes is the new
   `Discount` row and the `Total`. This keeps AC3's literal "subtotal minus discount" relationship
   visible as a sub-total-to-discount delta while not inventing new tax-recalculation behaviour
   the design/ACs never asked for. **Flagging for reviewer sign-off**, same as the
   `promo-code-states` open question already recorded (`resolution.decision: "deferred"`) in the
   design context — if a discount-affects-tax model is actually wanted, that needs its own
   design pass.
2. **No "empty/default" or "invalid" PromoCodeField state is drawn**, and **no remove/undo
   control is drawn on the applied state either** (node `13:362`–`13:370` is only the check-icon
   + text + "Applied" pill — no trash icon, no second "Remove" button). This is the same gap
   `design-context.json` already recorded as the blocking-but-deferred `promo-code-states` open
   question. Per that entry's own `arc_assumption`/`assumed_option` (`extend-tokens`), I build:
   - **Default/empty** (AC1): input with placeholder text, neutral `var(--border)` outline
     (matching `TextField`'s existing chrome, `--surface-muted` fill, radius `var(--radius-md)`),
     trailing icon none, and a neutral outline "Apply" button (`var(--surface)` background,
     `var(--border)` border, `var(--ink)` text, `var(--radius-md)`) in place of the drawn green
     "Applied" pill.
   - **Applied** (AC2/AC3): pixel-faithful to `13:362`–`13:370` (green border/text input, green
     check-circle, solid `var(--success)` "Applied" pill).
   - **Invalid** (AC4): red `var(--brand)` border on the input (extending the palette the same
     way `--success` was used for the drawn state) plus inline error text in `var(--brand)`,
     Geist 14/400, directly below the field; button reverts to the neutral "Apply" state.
   - **Remove** (AC5): since no distinct remove control is drawn, the "Applied" pill itself is
     reused as the removal control — once applied, clicking it (label stays "Applied") posts to
     the remove endpoint and reverts the row to the default/empty state. This, too, is called out
     as an assumption for reviewer sign-off, not a silent invention: the alternative (adding a new
     small trash/"×" icon button next to the pill, mirroring `RemoveLineItemButton`'s red
     trash+text pattern) is equally valid and can be swapped in without changing any test's
     observable HTTP contract if the reviewer prefers it.

## Data model / architecture for this story
- `src/store/cartStore.js` — new. In-memory module-level state for a **single demo cart**
  (no auth/session in this app, same simplification `feedPage`/`web.js` already made). Seeds
  exactly the design's numbers so tests can assert on them directly:
  ```js
  { subtotal: 54.00, deliveryFee: 0, ovenSurcharge: 1.50, salesTax: 4.72, promoCode: null }
  ```
  Exposes `reset()`, `getCart()`, `applyPromoCode(code)`, `removePromoCode()`. `applyPromoCode`
  looks up the code (case-insensitive, trimmed) in `src/data/promoCodes.js`; on a hit, stores
  `{ code, discountPercent }` on the cart and returns success; on a miss, returns
  `{ ok: false }` and leaves the cart's `promoCode` untouched. All money math (`discount`,
  `total`) is derived on read via a `getSummary()` helper (`Math.round(x * 100) / 100` rounding,
  matching the 2-decimal values already in the design) rather than stored redundantly.
- `src/data/promoCodes.js` — new. A plain object of recognised codes, seeded with the one code
  the design shows: `{ FORNOROSSO10: { discountPercent: 10 } }`. `10%` is inferred from the
  code's own name/suffix (no percentage value is printed anywhere in the frame); noted as an
  assumption.
- `src/views/pages/cartPage.js` — new. Renders the full page via `renderLayout`: `SiteHeader`
  (logo `F` mark, `PrimaryNav` with "Cart" active + red underline, `HeaderCartIndicator` with
  the ETA text and cart badge), the "Your Selected Order" card and "Delivery Destination" card
  rendered as **static markup matching the design's fixture data** (Classic Margherita/Diavola/
  Rosemary Garlic Focaccia rows, delivery address fields) since no AC in this story exercises
  cart-item editing or the address form, then the "Order Summary" card (dynamic: subtotal,
  discount row when present, fee/tax rows, total, `PromoCodeField` in its current state, "Proceed
  to Checkout" button), then `SiteFooter`. Takes the cart summary + UI state (`'default' |
  'applied' | 'error'`, plus an error message and the code the user typed) as parameters so the
  route can drive every state.
- `src/views/layout.js` — extended (not replaced) with the new tokens/classes this page needs
  (`--ink`, `--brand`, `--success`, `--surface-muted`, `--radius-xl`/`--radius-md`, Fraunces
  import, `.promo-code-field`, `.summary-line`, etc.) alongside the existing Facebook-page
  styles already in that file — both pages' CSS coexist in one `<style>` block, same as today.
- `src/routes/cart.js` — new router: `GET /cart` (render current cart state), `POST
  /cart/promo/apply` (apply a code, re-render page 200 on success / 200 with inline error state
  on an invalid code — following this repo's existing pattern of re-rendering the same page with
  a different state rather than redirecting, e.g. `POST /register`), `POST /cart/promo/remove`
  (clear the code, re-render page). Mounted in `src/app.js` alongside `webRouter`.
- `src/utils/escapeHtml.js` — reused as-is for interpolating the user-typed promo code back into
  the input's `value` attribute on the error state (XSS safety, same reason it exists today).

## TDD task breakdown

### AC1 — cart page loads with an empty promo field and Apply available
- **Failing test first** (`tests/cart.test.js`, new file, `beforeEach(() => cartStore.reset())`):
  `GET /cart` → `200`, HTML content-type; body contains a `PROMO CODE` labeled input
  (`name="promoCode"`) with an empty `value=""` (or no `value` attribute) and no `applied`
  styling class, and an enabled button containing `Apply` (not `Applied`).
- **Minimal code**: `src/store/cartStore.js` (seed + `reset`/`getCart`), `src/views/layout.js`
  (new tokens/base classes only, no promo-specific ones yet), `src/views/pages/cartPage.js`
  rendering just the header + Order Summary card's line items (no discount row yet) + the
  default-state `PromoCodeField` markup, `src/routes/cart.js` with `GET /cart`, mounted in
  `src/app.js`.
- **Files**: create `src/store/cartStore.js`, `src/views/pages/cartPage.js`,
  `src/routes/cart.js`, `tests/cart.test.js`; modify `src/views/layout.js`, `src/app.js`.

### AC2 — applying a recognised code shows discount, updated total, and a confirmed applied state
- **Failing test first** (`tests/cart.test.js`): `POST /cart/promo/apply` with
  `{ promoCode: 'FORNOROSSO10' }` → `200`; body shows the `Discount` summary row with `-$5.40`,
  a `Total` of `$54.82`, and the `PromoCodeField` in its applied state: the code `FORNOROSSO10`
  echoed in the (now green-styled) input, the check-circle icon markup, and the pill button
  reading `Applied`. Also assert case-insensitivity (`fornorosso10` also applies) and that
  whitespace is trimmed.
- **Minimal code**: `src/data/promoCodes.js`; `cartStore.applyPromoCode`/`getSummary` (discount
  math per the "Two gaps" resolution above); extend `cartPage.js` to render the `Discount` row
  conditionally and the applied `PromoCodeField` variant (green border/icon/pill, per
  `design-context.json`'s `13:362` props); `POST /cart/promo/apply` handler in
  `src/routes/cart.js`.
- **Files**: create `src/data/promoCodes.js`; modify `src/store/cartStore.js`,
  `src/views/pages/cartPage.js`, `src/routes/cart.js`, `tests/cart.test.js`.

### AC3 — order summary always shows subtotal, discount line, and a correctly-computed total
- **Failing test first** (`tests/cart.test.js`): after applying `FORNOROSSO10`, assert **all
  three** are present in one response — `Subtotal` `$54.00`, `Discount` `-$5.40`, `Total`
  `$54.82` — and assert the arithmetic invariant directly:
  `total === round2(subtotal - discount + deliveryFee + ovenSurcharge + salesTax)` computed from
  the same numbers embedded in the page (avoids a brittle hard-coded string double-check, while
  still pinning the literal `$54.82` above). Also add a companion case for a *different* seeded
  subtotal (temporarily seed the store with a second cart shape via a test-only
  `cartStore.reset({ subtotal: 100, ... })` overload) to prove the relationship isn't
  coincidentally hard-coded for one number.
- **Minimal code**: make `cartStore.reset(overrides)` accept optional overrides (small,
  test-support addition, consistent with `userStore.reset()`'s signature being trivial); ensure
  `getSummary()`'s rounding is applied consistently.
- **Files**: modify `src/store/cartStore.js`, `tests/cart.test.js`.

### AC4 — an unrecognised/invalid code shows an error, no discount applied
- **Failing test first** (`tests/cart.test.js`): `POST /cart/promo/apply` with
  `{ promoCode: 'NOTAREALCODE' }` → `200`; body contains an inline error message (e.g. "That
  promo code isn't valid.") and the input re-rendered with the attempted code
  (`value="NOTAREALCODE"`, HTML-escaped) styled with the red/error border class, no `Discount`
  row, `Total` unchanged at `$60.22`, and the button back to `Apply` (not `Applied`). Also cover
  an empty/blank submission → same error state with a suitable message, and confirm
  `cartStore.getCart().promoCode` stays `null` in both cases.
- **Minimal code**: `cartStore.applyPromoCode` returns `{ ok: false }` on a miss/blank input
  without mutating state; `cartPage.js`'s error-state `PromoCodeField` variant (red border,
  inline `field-error`-style text reusing the existing `.field-error` pattern from
  `layout.js`); route handler renders the page in the error UI state when `applyPromoCode` fails.
- **Files**: modify `src/store/cartStore.js`, `src/views/pages/cartPage.js`,
  `src/routes/cart.js`, `tests/cart.test.js`.

### AC5 — removing an applied code clears the discount and reverts the total
- **Failing test first** (`tests/cart.test.js`): apply `FORNOROSSO10` (confirm the applied/
  discounted state as in AC2), then `POST /cart/promo/remove` → `200`; body shows the
  `PromoCodeField` back in the default/empty state, no `Discount` row, `Total` back to
  `$60.22`, and `cartStore.getCart().promoCode` is `null` again.
- **Minimal code**: `cartStore.removePromoCode()`; `POST /cart/promo/remove` handler in
  `src/routes/cart.js` re-rendering the default page state.
- **Files**: modify `src/store/cartStore.js`, `src/routes/cart.js`, `tests/cart.test.js`.

## Out of scope (explicitly not built, per "stay within ACs")
- Cart item editing (`QuantityStepper` +/-, `RemoveLineItemButton`) and the Delivery
  Destination form fields are rendered as **static markup** matching the design's fixture data;
  no route/handler makes them interactive. No AC in this story touches them.
- The header's live cart item-count badge and cross-page nav (`Home`/`Our Menu` linking
  anywhere real) are rendered per the design but are not wired to any shared/global state —
  that's the parent epic's broader concern, not this story's ACs.
- No persistent session/cookie or multi-cart/multi-user support — one process-wide demo cart,
  consistent with this repo's existing no-auth-on-website-pages pattern (see MT-STORY-024's
  plan's own scoping note).
- No "Proceed to Checkout" behaviour beyond rendering the button — no AC in this story exercises
  checkout.
- Only one recognised promo code (`FORNOROSSO10`) is seeded; no promo-code admin/management
  surface, expiry, min-order-value, or stacking rules — none are implied by the ACs or shown in
  the design.
