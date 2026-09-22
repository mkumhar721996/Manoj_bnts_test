summary: |
  Extends the existing server-rendered cart/checkout flow (`GET /cart` -> `POST /checkout`,
  built for the prior cart story) so a logged-in user can pick a previously saved delivery
  address instead of retyping it, splits an address into "major" fields (recipient name,
  street, city, state, postal code, country) versus "minor" fields (apartment/unit, floor,
  delivery instructions) per AC7/AC8, offers to save a newly entered address after a
  successful order with a one-time automatic retry on failure, and enforces a 10-saved-address
  cap per user. This adds a new in-memory `addressStore`, a new optional-user-identification
  middleware for the website's cookie session (mirroring the existing `sessionStore`/`userStore`
  pair already used by `requireGameSession`/`requireVerifiedUser`, but non-redirecting so
  guests keep working exactly as before), extends `deliveryDetailsValidator` with the new
  optional fields, and extends `cartPage`/`checkoutPage` plus a new minimal `addressesPage`
  (the AC8 redirect target).

scope:
  - description: |
      Add `src/store/addressStore.js`, an in-memory store of saved addresses keyed by user id,
      following the exact shape of `src/store/expenseStore.js` (module-level collection +
      `reset()` for tests). API:
      ```js
      function list(userId) { ... }                  // returns [] if none
      function findById(userId, id) { ... }
      function save(userId, address) { ... }          // pushes; throws are the caller's problem (used by the retry logic)
      function replaceAll(userId, addresses) { ... }  // used to prune invalid addresses (AC6)
      function reset() { ... }
      module.exports = { list, findById, save, replaceAll, reset };
      ```
    files:
      - src/store/addressStore.js
    rationale: |
      No existing store models a per-user collection of addresses; `expenseStore.js` is the
      closest existing pattern (in-memory array + CRUD-ish helpers + `reset()`) in this repo,
      so this mirrors it rather than inventing a new persistence style.

  - description: |
      Add `src/middleware/attachOptionalUser.js`: reads the `sessionToken` cookie via the
      existing `parseCookies` util and `sessionStore.findUserId(token)` (the same plain,
      non-expiring lookup, NOT `isActive`/`touch`, which are `/game`'s idle-timeout
      mechanism), sets `req.user` if a valid user id is found, and always calls `next()` so
      guests keep using `/cart`/`/checkout` unchanged.
      ```js
      function attachOptionalUser(req, res, next) {
        const cookies = parseCookies(req.headers.cookie);
        const userId = cookies.sessionToken ? sessionStore.findUserId(cookies.sessionToken) : undefined;
        req.user = userId ? userStore.findById(userId) : undefined;
        next();
      }
      ```
    files:
      - src/middleware/attachOptionalUser.js
    rationale: |
      `requireGameSession` is the only existing web-cookie-session middleware, but it redirects
      unauthenticated requests away, which is wrong for `/cart`/`/checkout` since they must
      keep serving guests. A separate, non-blocking middleware avoids overloading
      `requireGameSession`'s contract and avoids coupling this story to `/game`'s idle-timeout
      `touch()` side effect.

  - description: |
      Extend `src/validation/deliveryDetailsValidator.js` to accept/return the additional
      address fields named by AC7/AC8 (`recipientName`, `floor`, `city`, `state`,
      `postalCode`, `country`), all optional; only `streetAddress` stays required.
      ```js
      function validate(payload) {
        // trims streetAddress, aptSuite, floor, deliveryInstructions, recipientName,
        // city, state, postalCode, country; only streetAddress is required
        return { errors, streetAddress, aptSuite, floor, deliveryInstructions,
                  recipientName, city, state, postalCode, country };
      }
      ```
    files:
      - src/validation/deliveryDetailsValidator.js
    rationale: |
      AC6 ("fails current validation rules") needs one real, already-existing rule to check a
      saved address against; reusing the existing `streetAddress` requirement rather than
      inventing new mandatory fields keeps this story from silently breaking the previous cart
      story's guest checkout tests (`tests/cart.test.js`), which only assert on
      `streetAddress`/`aptSuite`/`deliveryInstructions`.

  - description: |
      Extend `src/views/pages/cartPage.js` to accept `savedAddresses` (array) and
      `selectedAddressId` (string | 'new' | undefined) in addition to its existing
      `errors`/`values`:
      ```js
      function renderCartPage({ errors = [], values = {}, savedAddresses = [], selectedAddressId } = {}) { ... }
      ```
      When `savedAddresses.length > 0`: render one radio `<input type="radio" name="addressId" value="${id}">`
      per saved address (checked only when it equals `selectedAddressId`) plus a `value="new"`
      "Enter a new address" option, each wrapped in a small inline `<script>` that navigates to
      `/cart?addressId=<value>` on change (glue code, the same inline-script convention
      `editExpensePage.js` already uses; not itself unit-testable via Supertest, only its
      markup is). The 6 major fields (`recipient-name`, `street-address`, `city`, `state`,
      `postal-code`, `country`) get a `readonly` attribute plus one adjacent
      `<a href="/account/addresses">Change address</a>` whenever a real saved address (not
      `'new'`, not absent) is selected; the 3 minor fields (`apt-suite`, `floor`,
      `delivery-instructions`) never get `readonly`. A hidden
      `<input type="hidden" name="addressId" value="${selectedAddressId || ''}">` is rendered
      inside the form whenever there are saved addresses, so `POST /checkout` knows which
      address (if any) the submitted values came from.
    files:
      - src/views/pages/cartPage.js
    rationale: |
      AC1/AC2/AC3/AC7/AC8/AC9 are all about what this one page renders/allows depending on
      saved-address state; consolidating that logic in the existing view function (rather than
      a new page) matches this codebase's one-view-per-route pattern.

  - description: |
      Modify `GET /cart` in `src/routes/web.js` to run `attachOptionalUser`, then: if
      `req.user`, prune saved addresses that fail `deliveryDetailsValidator.validate` (AC6)
      via `addressStore.list`/`replaceAll`; if zero valid addresses remain, fall through to
      `cartPage`'s existing guest sample-data defaults unchanged (AC4); otherwise resolve
      `selectedAddressId` from `req.query.addressId` — if it names a real saved address,
      prefill `values` from it (AC2); if it's `'new'` or absent, force every field to `''`
      (AC3/AC9, no fallback to the guest sample-data defaults in this case).
    files:
      - src/routes/web.js
    rationale: |
      `GET /cart` is already this app's "proceed to checkout" entry point (it's where the
      delivery-details form lives today), so AC1/AC2/AC3/AC4/AC6/AC9 are naturally implemented
      as branches of its existing handler rather than a new route.

  - description: |
      Modify `POST /checkout` in `src/routes/web.js` and `src/views/pages/checkoutPage.js`:
      read `addressId` from the posted body (the cartPage hidden field above); on validation
      success, if `req.user` and the submitted `addressId` does not match an existing saved
      address (i.e. it's a brand-new address), render `checkoutPage` with
      `addressSaveOffer: true`, a `<form action="/checkout/save-address" method="post">`
      containing the address as hidden fields plus a `Save this address to my account` submit
      button (AC5); if it matches a saved address, or the user is a guest, no offer is shown.
      `renderCheckoutPage`'s signature grows from
      `{ streetAddress, aptSuite, deliveryInstructions }` to
      `{ recipientName, streetAddress, aptSuite, floor, city, state, postalCode, country, deliveryInstructions, addressSaveOffer = false, addressSaveNotice }`.
    files:
      - src/routes/web.js
      - src/views/pages/checkoutPage.js
    rationale: |
      "Order placed successfully" in this codebase is exactly "POST /checkout validated and
      rendered the confirmation page"; there is no separate payment/fulfillment step to hook
      into, so AC5's save-offer is rendered as part of that existing success response.

  - description: |
      Add `POST /checkout/save-address` to `src/routes/web.js`: requires `req.user` (redirect
      `/` otherwise); re-validates the posted address and re-renders with an
      `addressSaveNotice: { type: 'error', message: 'Your address has validation errors. Please check all required fields.' }`
      if it fails; if `addressStore.list(userId).length >= 10`, re-render with
      `addressSaveNotice: { type: 'capacity', message: 'You already have 10 saved addresses. Delete one to save a new address.' }`
      and do not call `addressStore.save` (AC12, a capacity rejection is a validation gate, not
      a transient failure, so it is not retried); otherwise call `addressStore.save(userId, address)`
      through a small `attemptSave` closure inside a `try/catch` that retries exactly once more
      on failure (AC10), and if the retry also throws, re-render with
      `addressSaveNotice: { type: 'error', message: 'We could not save your address. Please try again from your account settings.' }`
      (AC11); on success (first or second attempt), re-render with
      `addressSaveNotice: { type: 'success', message: 'Address saved to your account.' }` (AC13).
    files:
      - src/routes/web.js
      - src/views/pages/checkoutPage.js
    rationale: |
      AC10/AC11/AC12/AC13 are all about the outcome of this one save action; a single new
      route keeps the retry/cap logic in one place, testable by mocking `addressStore.save`
      with `jest.spyOn`.

  - description: |
      Add `src/views/pages/addressesPage.js` (minimal placeholder, following the same
      "no design exists -> minimal identifiable marker" convention `gamePage.js` used for
      MT-STORY-055) and `GET /account/addresses` in `src/routes/web.js` (redirects to `/` if
      `!req.user`, otherwise lists `addressStore.list(req.user.id)`).
    files:
      - src/views/pages/addressesPage.js
      - src/routes/web.js
    rationale: |
      AC8 requires a real redirect target; no AC describes managing (editing/deleting)
      addresses on that page, so it is built no further than what AC8 needs to point at.

tests:
  - |
    AC1 (logged-in user with a saved address sees it as a selectable option): seed
    `addressStore.save(user.id, { id: 'addr-1', streetAddress: '500 Main St', city: 'Springfield', ... })`
    after registering+logging in via a Supertest `agent`, then `GET /cart` and assert
    `expect(res.text).toMatch(/<input[^>]*type="radio"[^>]*name="addressId"[^>]*value="addr-1"[^>]*>/)`
    and `expect(res.text).toContain('500 Main St')`.
  - |
    AC2 (selecting a saved address pre-fills the form): `agent.get('/cart?addressId=addr-1')`,
    then `expect(res.text).toMatch(/id="street-address"[^>]*value="500 Main St"/)` and
    `expect(res.text).toMatch(/id="city"[^>]*value="Springfield"/)`.
  - |
    AC3 (choosing "enter a new address" shows a blank form): `agent.get('/cart?addressId=new')`,
    then `expect(res.text).toMatch(/id="street-address"[^>]*value=""/)` and
    `expect(res.text).not.toMatch(/name="addressId"[^>]*value="addr-1"[^>]*checked/)`.
  - |
    AC4 (zero saved addresses shows the same form as a guest): `agent.get('/cart')` with no
    seeded addresses, then `expect(res.text).not.toContain('name="addressId"')` and
    `expect(res.text).toContain('128 Pizzaiolo Boulevard')` (the existing guest sample default).
  - |
    AC5 (a successful order with a newly entered address offers to save it):
    `agent.post('/checkout').type('form').send({ recipientName: 'Jane Doe', streetAddress: '9 New Ave', city: 'Metropolis', state: 'NY', postalCode: '10001', country: 'USA' })`,
    then `expect(res.text).toMatch(/action="\/checkout\/save-address"/)` and
    `expect(res.text).toContain('Save this address to my account')`; also assert that when the
    posted `addressId` matches an already-saved address, `res.text` does NOT contain
    `action="/checkout/save-address"`.
  - |
    AC6 (a saved address that fails validation is removed on proceeding to checkout): seed
    `addressStore.save(user.id, { id: 'bad-1', streetAddress: '' })`, then `agent.get('/cart')`,
    then `expect(addressStore.list(user.id)).toHaveLength(0)` and
    `expect(res.text).not.toContain('value="bad-1"')`.
  - |
    AC7 (editing a minor field on a pre-filled saved address is accepted inline):
    `agent.post('/checkout').type('form').send({ addressId: 'addr-1', streetAddress: '500 Main St', aptSuite: 'Unit 9', floor: '3', city: 'Springfield', state: 'IL', postalCode: '62704', country: 'USA', deliveryInstructions: 'Leave with doorman' })`,
    then `expect(res.status).toBe(200)`, `expect(res.text).toContain('Unit 9')`, and
    `expect(res.text).toContain('Leave with doorman')`.
  - |
    AC8 (attempting to change a major field redirects to address management): after
    `agent.get('/cart?addressId=addr-1')`, assert
    `expect(res.text).toMatch(/id="street-address"[^>]*readonly/)`,
    `expect(res.text).toMatch(/id="city"[^>]*readonly/)`,
    `expect(res.text).toMatch(/<a[^>]*href="\/account\/addresses"[^>]*>/)`, and
    `expect(res.text).not.toMatch(/id="apt-suite"[^>]*readonly/)`.
  - |
    AC9 (no saved address is pre-selected and the form stays unfilled on initial load): seed
    two addresses, then plain `agent.get('/cart')` (no `addressId` query param), then
    `expect(res.text).not.toMatch(/name="addressId"[^>]*checked/)` and
    `expect(res.text).toMatch(/id="street-address"[^>]*value=""/)`.
  - |
    AC10 (a failed save is retried once automatically):
    `const saveSpy = jest.spyOn(addressStore, 'save').mockImplementationOnce(() => { throw new Error('write failed'); });`
    then `agent.post('/checkout/save-address').type('form').send({ streetAddress: '9 New Ave', city: 'Metropolis', state: 'NY', postalCode: '10001', country: 'USA' })`,
    then `expect(saveSpy).toHaveBeenCalledTimes(2)` and
    `expect(res.text).toContain('Address saved to your account.')`.
  - |
    AC11 (a save that fails on retry too notifies the user):
    `const saveSpy = jest.spyOn(addressStore, 'save').mockImplementation(() => { throw new Error('write failed'); });`
    then the same `POST /checkout/save-address`, then
    `expect(saveSpy).toHaveBeenCalledTimes(2)` and
    `expect(res.text).toMatch(/could not save|was not saved/i)`.
  - |
    AC12 (a new address is not saved once the user already has 10): seed 10 addresses via a
    loop of `addressStore.save(user.id, { id: \`addr-${i}\`, streetAddress: \`${i} Main St\` })`,
    then `POST /checkout/save-address` with a new address, then
    `expect(addressStore.list(user.id)).toHaveLength(10)` and
    `expect(res.text).toMatch(/already have 10 saved addresses/i)`.
  - |
    AC13 (a new address is added when the user has fewer than 10): with zero seeded addresses,
    `POST /checkout/save-address` with a valid address, then
    `expect(addressStore.list(user.id)).toHaveLength(1)` and
    `expect(addressStore.list(user.id)[0].streetAddress).toBe('9 New Ave')`.
  - |
    Supporting case for AC10-13's validation gate: `POST /checkout/save-address` with a blank
    `streetAddress` does not save, asserting
    `expect(addressStore.list(user.id)).toHaveLength(0)` and
    `expect(res.text).toMatch(/validation errors/i)`.

assumptions_or_open_questions:
  - |
    "Checkout" in this story is the existing `GET /cart` (delivery-details form) ->
    `POST /checkout` (order confirmation) flow already built for the prior cart story; no new
    dedicated "checkout page" route is introduced.
  - |
    Only `streetAddress` remains a validation-enforced required field; the newly added
    `recipientName`/`city`/`state`/`postalCode`/`country`/`floor` fields are optional. This
    keeps every existing `tests/cart.test.js` assertion passing unmodified while still giving
    AC7/AC8's major/minor classification real fields to operate on.
  - |
    Identifying a logged-in user on `/cart`/`/checkout`/`/checkout/save-address`/
    `/account/addresses` uses `sessionStore.findUserId(token)` (plain lookup), not
    `isActive`/`touch` — this avoids adding `/game`'s idle-timeout side effects to any other
    website route.
  - |
    AC8 ("attempts to change a major field" -> redirected) is implemented as `readonly`
    major-field inputs plus an adjacent "Change address" link to `/account/addresses`, rather
    than a server-side rejection of a submitted edit — a browser cannot actually submit a
    changed value for a `readonly` input, and no design file exists for this story specifying a
    different interaction.
  - |
    The address-management page's own content (listing/editing/deleting individual saved
    addresses) is out of scope beyond a minimal placeholder — no AC describes it; AC8 only
    requires it to exist as a redirect target.
  - |
    The 10-address cap (AC12) is treated as a pre-save validation gate, not a failure eligible
    for the AC10/AC11 automatic retry, since retrying an over-capacity save can never succeed.
  - |
    Open question: if a user toggles between saved addresses and "enter a new address" (AC3)
    after already typing into a blank form, should previously-typed values persist? This plan
    always resets to blank on selecting `addressId=new`, since no saved-address selection has
    occurred yet at that point — flagging in case product wants persistence instead.

package_dependencies: []

notes: |
  No new third-party dependency is needed; the retry logic, address cap, and save-offer flow
  are all plain Express/Node, consistent with this repo's existing "no new dependency unless
  needed" pattern.

  ```mermaid
  flowchart TD
    app[src/app.js] --> web[src/routes/web.js]
    web --> optUser[src/middleware/attachOptionalUser.js]
    optUser --> sessionStore[src/store/sessionStore.js]
    optUser --> userStoreMod[src/store/userStore.js]
    web --> addressStore[src/store/addressStore.js]
    web --> validator[src/validation/deliveryDetailsValidator.js]
    web --> cartPage[src/views/pages/cartPage.js]
    web --> checkoutPage[src/views/pages/checkoutPage.js]
    web --> addressesPage[src/views/pages/addressesPage.js]
    cartPage --> layout[src/views/layout.js]
    checkoutPage --> layout
    addressesPage --> layout

    classDef touched fill:#f96,color:#000
    class web,optUser,addressStore,validator,cartPage,checkoutPage,addressesPage touched
  ```

  `web.js` fans out to every touched module (it owns `/cart`, `/checkout`,
  `/checkout/save-address`, `/account/addresses`); `attachOptionalUser` is the only new caller
  of the existing `sessionStore`/`userStore` pair, read-only and non-redirecting so guest
  traffic through `/cart`/`/checkout` is unaffected; `cartPage`/`checkoutPage`/`addressesPage`
  all still render through the existing shared `layout.js`, unchanged.
