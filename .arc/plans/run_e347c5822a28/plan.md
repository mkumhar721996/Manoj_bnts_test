# MT-STORY-025 — Global Navigation & Store Info Shell

## Context / assumptions
The existing app (`src/`) is a server-rendered Express + Jest/Supertest "Facebook-style"
demo: every page is a plain HTML string built by a `render*Page(...)` function and wrapped by
`renderLayout(title, bodyHtml)` (`src/views/layout.js`). There is no client-side JS, no
cookie/session for the web (HTML) routes, and no existing concept of a menu catalog or a cart
— those are introduced here for the first time because AC3/AC5 require real `Our Menu` and
`Cart` pages/state to navigate to and to mutate.

This ticket also inherits a domain mismatch: the copy in the existing pages is
Facebook-branded, while this ticket's ACs describe a food-ordering shell (Our Menu, Cart,
delivery ETA, store hours). Re-branding the app is out of scope — only the persistent
header/footer shell described by the ACs is built. To keep this additive and avoid breaking
the five existing page-render functions and their passing tests, the new global header/footer
are injected once, centrally, inside `renderLayout`, without touching the per-page
`<header class="site-header">` blocks that `homePage.js`, `feedPage.js`,
`registrationSuccessPage.js`, `registrationErrorPage.js`, and `loginErrorPage.js` already
render as part of their own body markup. Every page still goes through `renderLayout`, so
every page automatically gets the new nav/footer — satisfying "any page" in AC1/AC2 — with
zero changes to those five files' signatures or existing assertions in `tests/web.test.js`.

Because the cart is a brand-new concept with no per-user session plumbing on the web routes
(login on `/login` doesn't set a cookie), the cart is implemented the same way `userStore` and
`sessionStore` already are: a single in-memory module-level store with a `reset()` for test
isolation. "Updates immediately" (AC5) is interpreted the way the rest of this app already
works — no AJAX/client JS exists anywhere — so the add/remove endpoints synchronously render
the updated Cart page (HTTP response reflects the new state right away, no redirect/reload
needed to see it).

## File layout to be created / modified
```
src/store/cartStore.js              # NEW — in-memory cart: addItem/removeItem/getItems/getDistinctCount/reset
src/data/menuItems.js               # NEW — fixed catalog of 3 sample items ({ id, name, price })
src/views/partials/globalNav.js     # NEW — renderGlobalNav(cartCount): header with Home/Our Menu/Cart links, ETA, cart badge
src/views/partials/siteFooter.js    # NEW — renderSiteFooter(): store hours/location/contact/social/legal
src/views/pages/menuPage.js         # NEW — renderMenuPage(items): "Our Menu" listing with Add-to-Cart forms
src/views/pages/cartPage.js         # NEW — renderCartPage(cartItems): "Your Cart" listing with Remove forms
src/views/layout.js                 # MODIFY — renderLayout() wraps bodyHtml with global nav + footer; new CSS
src/routes/web.js                   # MODIFY — add GET /menu, GET /cart, POST /cart/add/:itemId, POST /cart/remove/:itemId
tests/web.test.js                   # MODIFY — new "MT-STORY-025 AC#" describe blocks; cartStore.reset() in beforeEach
```

No existing page-render function (`homePage.js`, `feedPage.js`, `registrationSuccessPage.js`,
`registrationErrorPage.js`, `loginErrorPage.js`) changes signature or content — `renderLayout`
reads `cartStore.getDistinctCount()` itself, so nothing needs to thread a cart count through.

## TDD build order

### Step 0 — scaffolding (no AC on its own)
- Create `src/store/cartStore.js`: `items` is a `Map<itemId, { itemId, name, price, quantity }>`.
  `addItem(itemId, name, price)` increments `quantity` if present, else inserts with
  `quantity: 1`. `removeItem(itemId)` deletes the key outright (removes the whole line item,
  not just one unit — matches "distinct line items" semantics). `getItems()` returns
  `Array.from(items.values())`. `getDistinctCount()` returns `items.size`. `reset()` clears
  the map.
- Create `src/data/menuItems.js` exporting a fixed array, e.g.
  `[{ id: 'classic-burger', name: 'Classic Burger', price: 8.99 }, { id: 'veggie-wrap', name: 'Veggie Wrap', price: 7.49 }, { id: 'iced-tea', name: 'Iced Tea', price: 2.99 }]`.
- No test written for this step; it's infrastructure only (mirrors how `userStore.js` has no
  dedicated unit test — it's exercised indirectly through the route tests).

### Step 1 — AC1 + AC4: header with nav links, ETA, and a '0' cart badge
- **Failing test first** (`tests/web.test.js`, new `describe('MT-STORY-025 AC1/AC4: ...')`):
  `GET /` with a fresh (`cartStore.reset()`'d) cart, expect `200` and `res.text` to contain:
  an anchor to `/` labeled `Home`, an anchor `href="/menu"` labeled `Our Menu`, an anchor
  `href="/cart"` labeled `Cart`, an element with `id="deliveryEta"` containing delivery-ETA
  copy, and `id="cartBadge">0<` (AC4: badge is `'0'` when the cart is empty).
- **Minimal code to pass:** `src/views/partials/globalNav.js` exports
  `renderGlobalNav(cartCount)` returning a `<header class="global-nav">` with the brand
  wordmark, a `<nav>` containing the three links (`Home` → `/`, `Our Menu` → `/menu`, `Cart`
  → `/cart`, the Cart link including `<span id="cartBadge" class="cart-badge">${cartCount}</span>`),
  and a `<div id="deliveryEta" class="delivery-eta">` with static copy (e.g. "Estimated
  delivery: 30–45 min" — no AC requires a computed/dynamic ETA). `src/views/layout.js` requires
  `cartStore` and `globalNav`, and `renderLayout` becomes
  `` `<body>${renderGlobalNav(cartStore.getDistinctCount())}${bodyHtml}...</body>` ``. Add
  `.global-nav`, `.global-nav__links`, `.global-nav__link`, `.cart-badge`, `.delivery-eta` CSS
  rules to the existing `STYLE` block in `layout.js`, following the existing custom-property
  tokens (no new hex/px literals outside `:root`).
- **Files:** create `src/views/partials/globalNav.js`; modify `src/views/layout.js`.

### Step 2 — AC2: footer with store hours, location, contact, social, legal links
- **Failing test first:** `GET /`, expect `res.text` to contain `id="storeHours"`,
  `id="storeLocation"`, `id="storeContact"` each with non-empty text, at least two elements
  with `class="social-link"`, and at least two with `class="legal-link"` (e.g. "Terms of
  Service", "Privacy Policy").
- **Minimal code to pass:** `src/views/partials/siteFooter.js` exports `renderSiteFooter()`
  returning a `<footer class="site-footer">` with static fixture copy for hours/location/
  contact, a handful of `class="social-link"` anchors, and `class="legal-link"` anchors
  (`href="#"`, consistent with this being static shell copy — no legal pages exist and none
  are required by any AC). `renderLayout` appends `renderSiteFooter()` after `bodyHtml`.
- **Files:** create `src/views/partials/siteFooter.js`; modify `src/views/layout.js`.

### Step 3 — AC3 (part 1): Our Menu and Cart pages exist and are reachable
- **Failing test first:** `GET /menu` expects `200` and body containing an "Our Menu" heading
  plus each fixture item's name and an `action="/cart/add/<id>"` form for each; `GET /cart`
  expects `200` and body containing a "Your Cart" heading and, on an empty cart, copy such as
  "Your cart is empty."
- **Minimal code to pass:** `src/views/pages/menuPage.js` exports `renderMenuPage(items)`
  rendering each catalog item with a `<form method="post" action="/cart/add/${item.id}">`
  submit button; `src/views/pages/cartPage.js` exports `renderCartPage(cartItems)` rendering
  each line item (name, quantity, price) with a `<form method="post" action="/cart/remove/${itemId}">`
  remove button, or empty-state copy when `cartItems.length === 0`. Add
  `router.get('/menu', ...)` calling `renderMenuPage(menuItems)` and `router.get('/cart', ...)`
  calling `renderCartPage(cartStore.getItems())` to `src/routes/web.js`.
- **Files:** create `src/views/pages/menuPage.js`, `src/views/pages/cartPage.js`; modify
  `src/routes/web.js`.

### Step 4 — AC3 (part 2) + AC5: adding an item updates the cart and its badge immediately
- **Failing test first:** `POST /cart/add/classic-burger` (a known catalog id) on a fresh
  cart; expect `200`, `res.text` to contain the item's name, `id="cartBadge">1<`, and a
  `action="/cart/remove/classic-burger"` form. Add a second, different item
  (`POST /cart/add/veggie-wrap`) and expect the badge to become `2` and both items listed.
  Add a case-of-note test: adding the *same* item twice keeps the badge at `1` (distinct line
  items, not total units) while the line item's quantity is `2`.
- **Minimal code to pass:** in `src/routes/web.js`, `router.post('/cart/add/:itemId', ...)`
  looks up `req.params.itemId` in `menuItems`; if found, calls
  `cartStore.addItem(item.id, item.name, item.price)`; either way responds `200` with
  `renderCartPage(cartStore.getItems())` (unknown ids are a no-op — no AC specifies error
  behavior for a bad id, and this keeps the route crash-safe at its input boundary).
- **Files:** modify `src/routes/web.js`.

### Step 5 — AC5 (continued): removing an item updates the cart and its badge immediately
- **Failing test first:** with two distinct items already added, `POST /cart/remove/classic-burger`;
  expect `200`, `res.text` to no longer contain the removed item's name,
  `id="cartBadge">1<`, and the remaining item still listed. Removing the last remaining item
  drops the badge back to `id="cartBadge">0<` and shows the empty-cart copy.
- **Minimal code to pass:** `router.post('/cart/remove/:itemId', ...)` calls
  `cartStore.removeItem(req.params.itemId)` and responds `200` with
  `renderCartPage(cartStore.getItems())`.
- **Files:** modify `src/routes/web.js`.

## Test hygiene
- Add `cartStore.reset()` alongside the existing `userStore.reset()` /
  `emailService.reset()` calls in `tests/web.test.js`'s `beforeEach`, so cart state doesn't
  leak between tests.
- New `describe` blocks are labeled `MT-STORY-025 AC1`..`AC5` (matching the `MT-STORY-019 ...`
  prefix convention already used in `tests/login.test.js`) so they're distinguishable from the
  pre-existing unprefixed `AC1`..`AC6` blocks in `tests/web.test.js`, which belong to the prior
  story's ACs and are left untouched.

## Out of scope (explicitly not built, per "stay within ACs")
- No re-branding of the existing Facebook-styled pages/copy.
- No per-user/session-scoped cart — a single global in-memory cart, matching this app's
  existing single global `userStore`/`sessionStore` pattern.
- No real product catalog, pricing, quantity-adjustment UI, or checkout flow — the menu is a
  fixed 3-item fixture list only large enough to prove nav + cart-count behavior.
- No working `/terms` or `/privacy` routes — footer legal links are static, unlinked-by-AC
  copy (`href="#"`), since only Home/Our Menu/Cart are required by AC3 to actually navigate.
- No AJAX/client-side JS for "immediate" badge updates — consistent with the rest of the app,
  the add/remove endpoints synchronously render the updated page in the HTTP response.
- No active-nav-item highlighting or ETA computed from real data — the ETA indicator is
  static copy, since no AC asks for it to reflect a real delivery estimate.
