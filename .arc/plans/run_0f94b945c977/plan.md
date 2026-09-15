summary: |
  Add a logged-in-only "Saved Addresses" web page that lists a user's own saved
  delivery addresses and lets them delete one after confirming, with strict
  per-user ownership enforcement. This introduces the first per-user resource
  store in the web (cookie-session) flow, so it also adds a small reusable
  `requireWebUser` middleware (parses the session cookie, validates the
  session, and attaches `req.user`) alongside a `requireOwnAddress` middleware
  that 404s on any address the caller doesn't own. The feature follows the
  list/delete-confirm/delete pattern already established for expenses
  (MT-STORY-079), reusing the same layout, CSS classes, and route-shape
  conventions. No address-creation flow exists yet in this story, so tests
  seed addresses directly into the new store.

scope:
  - description: |
      Create an in-memory address store keyed by owning user, mirroring
      `expenseStore.js`'s shape but adding a `listForUser(userId)` accessor
      instead of a global list, since AC7/AC8 require owner-scoped reads.
    files:
      - src/store/addressStore.js
    rationale: |
      No address data model exists in the codebase yet (the closest thing,
      `deliveryDetailsValidator.js`, only validates checkout form input and
      never persists anything). AC1/AC5/AC6/AC7 all depend on a queryable,
      per-user list of persisted addresses.

  - description: |
      Add a `requireWebUser` middleware that reads the `sessionToken` cookie
      (via the existing `parseCookies` util), validates it with
      `sessionStore.isActive`/`touch`, resolves the owning user via
      `userStore.findById`, and either attaches `req.user` and calls `next()`
      or redirects to `/` (mirroring `requireGameSession`'s fail-closed
      redirect for an unauthenticated/expired session).
    files:
      - src/middleware/requireWebUser.js
    rationale: |
      Every AC is gated on "a logged-in user"; `requireGameSession` proves the
      cookie-session pattern for web pages but never exposes `req.user`, and
      `requireVerifiedUser` only supports the separate Bearer-token JSON API
      (`/api/account`). Address routes need the real logged-in user's id to
      filter and to authorize deletes, so a small new middleware is the
      minimal fit rather than overloading either existing one.

  - description: |
      Add a `requireOwnAddress` middleware, structurally identical to
      `requireExpense.js`, that looks up `req.params.id` in `addressStore` and
      404s if it doesn't exist OR its `userId` doesn't match `req.user.id`
      (must run after `requireWebUser` so `req.user` is set).
    files:
      - src/middleware/requireOwnAddress.js
    rationale: |
      AC8 requires that deleting another user's address is rejected and the
      list is left unchanged. Folding the ownership check into the existing
      not-found middleware pattern means a foreign address 404s exactly like
      a nonexistent one, so the response never leaks whether the id exists
      for a different user.

  - description: |
      Add two view pages mirroring `expensesPage.js` and
      `deleteConfirmPage.js`: a list page with an empty-state message and a
      delete-confirm page with a POST form (confirm) and a plain link back to
      the list (cancel).
    files:
      - src/views/pages/addressesPage.js
      - src/views/pages/addressDeleteConfirmPage.js
    rationale: |
      AC2-AC6 require a confirmation step before delete and an empty-state
      message; reusing the same markup/CSS classes (`.card`, `.post`,
      `.btn-danger`, `#empty-*`, `#confirm-delete-action`,
      `#cancel-delete-action`) as the just-shipped expense delete flow keeps
      the UI and tests consistent with the newest precedent in this codebase.

  - description: |
      Wire three routes into the web router: `GET /addresses` (list, scoped to
      `req.user.id`), `GET /addresses/:id/delete-confirm`, and
      `POST /addresses/:id/delete`, each behind `requireWebUser` and (for the
      latter two) `requireOwnAddress`.
      Signature shape added to `src/routes/web.js`:

      ```js
      router.get('/addresses', requireWebUser, (req, res) => {
        res.type('html').send(renderAddressesPage({ addresses: addressStore.listForUser(req.user.id) }));
      });

      router.get('/addresses/:id/delete-confirm', requireWebUser, requireOwnAddress, (req, res) => {
        res.type('html').send(renderAddressDeleteConfirmPage({ address: req.address }));
      });

      router.post('/addresses/:id/delete', requireWebUser, requireOwnAddress, (req, res) => {
        addressStore.remove(req.address.id);
        res.type('html').send(renderAddressesPage({ addresses: addressStore.listForUser(req.user.id) }));
      });
      ```
    files:
      - src/routes/web.js
    rationale: |
      Matches the existing route-composition style in this file (see the
      `/expenses...` routes just above), where each route composes a
      middleware guard, a store call, and a page render.

  - description: |
      New test file covering all 8 ACs end-to-end via supertest against the
      real app, reusing the `registerAndLogin` cookie-session helper pattern
      from `tests/game.test.js`.
    files:
      - tests/addresses.test.js
    rationale: |
      Follows this repo's convention (see `tests/expenses.test.js`,
      `tests/game.test.js`) of black-box HTTP tests against `src/app.js`
      rather than unit-testing stores/middleware in isolation.

tests:
  - |
    AC1 (all saved addresses are listed on page load): seed two addresses for
    the logged-in user directly via `addressStore.save(...)`, then assert
    both appear:
    ```js
    const res = await agent.get('/addresses');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="address-list"');
    expect(res.text).toContain('123 Main St');
    expect(res.text).toContain('456 Oak Ave');
    ```
    Minimal code: `addressStore.js` (`save`/`listForUser`), `requireWebUser.js`,
    `addressesPage.js`, and the `GET /addresses` route in `web.js`.

  - |
    AC2 (selecting delete shows a confirmation prompt before removal): hit
    the delete-confirm page and assert it renders confirm/cancel controls
    without having deleted anything:
    ```js
    const res = await agent.get(`/addresses/${addressId}/delete-confirm`);
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/id="confirm-delete-action"/);
    expect(res.text).toMatch(new RegExp(`action="/addresses/${addressId}/delete"`));
    expect(res.text).toMatch(/id="cancel-delete-action"/);

    const listRes = await agent.get('/addresses');
    expect(listRes.text).toContain('123 Main St');
    ```
    Minimal code: `requireOwnAddress.js`, `addressDeleteConfirmPage.js`, and
    the `GET /addresses/:id/delete-confirm` route.

  - |
    AC3 (confirming removes the address): POST the delete form and assert the
    returned list no longer contains it:
    ```js
    const res = await agent.post(`/addresses/${addressId}/delete`);
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('123 Main St');
    ```
    Minimal code: `addressStore.remove`, and the `POST /addresses/:id/delete`
    route.

  - |
    AC4 (cancelling leaves the address in the list): visiting delete-confirm
    and then simply not posting must leave the address untouched:
    ```js
    await agent.get(`/addresses/${addressId}/delete-confirm`);
    const listRes = await agent.get('/addresses');
    expect(listRes.text).toContain('123 Main St');
    expect(listRes.text).toContain(`id="delete-address-${addressId}"`);
    ```
    No new production code beyond AC2's (cancel is a plain link, not a call
    to the delete route — verified by asserting no mutation occurred).

  - |
    AC5 (empty-state message when there are no saved addresses):
    ```js
    const res = await agent.get('/addresses');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="empty-addresses"');
    expect(res.text).not.toContain('id="address-list"');
    ```
    Minimal code: the empty-state branch in `addressesPage.js`.

  - |
    AC6 (deleting the only address shows the empty-state message): seed
    exactly one address, delete it, assert the response is the empty state:
    ```js
    const res = await agent.post(`/addresses/${onlyAddressId}/delete`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="empty-addresses"');
    ```
    No new production code beyond AC3/AC5's (this is the empty-state branch
    reached via the delete route's re-render).

  - |
    AC7 (only the logged-in user's own addresses are shown): seed one address
    for the logged-in user and one for a second, separately-registered user,
    then assert only the caller's own address appears:
    ```js
    const res = await agent.get('/addresses');
    expect(res.text).toContain('123 Main St');
    expect(res.text).not.toContain('999 Other User Ave');
    ```
    Minimal code: `addressStore.listForUser(userId)` filtering by `userId`,
    used in the `GET /addresses` route instead of a global list.

  - |
    AC8 (deleting another user's address is rejected and the list is
    unchanged): as user A, POST delete against an address owned by user B:
    ```js
    const res = await agentA.post(`/addresses/${userBsAddressId}/delete`);
    expect(res.status).toBe(404);
    expect(addressStore.findById(userBsAddressId)).toBeDefined();

    const listResB = await agentB.get('/addresses');
    expect(listResB.text).toContain('999 Other User Ave');
    ```
    Minimal code: `requireOwnAddress.js`'s ownership check (`address.userId
    !== req.user.id` -> 404), applied to the `POST /addresses/:id/delete`
    route.

assumptions_or_open_questions:
  - |
    Route path chosen as flat `/addresses` (not nested under `/account/...`),
    consistent with this router's existing flat resource routes (`/expenses`,
    `/cart`, `/checkout`). "account/address settings" in the AC text is read
    as describing the page's purpose, not a required URL shape. Happy to
    rename if a different path is expected.
  - |
    No address-creation or edit flow exists yet and none of the 8 ACs call
    for one, so this plan does not add a `POST /addresses` route or a form to
    create an address. Tests seed rows directly via `addressStore.save(...)`,
    the same way other test files seed via `userStore.save(...)` when there's
    no HTTP-level creation path in scope.
  - |
    Address shape is assumed to reuse the existing checkout delivery-detail
    fields (`streetAddress`, `aptSuite`, `deliveryInstructions`) plus a new
    `userId` owner field, since `deliveryDetailsValidator.js` is the only
    existing "address" concept in the codebase. A future add/edit-address
    story would presumably reuse this same shape and validator.
  - |
    An unauthenticated request to any `/addresses*` route redirects to `/`
    via `requireWebUser`, mirroring `requireGameSession`'s existing
    convention for logged-in-only web pages. No AC states this directly (all
    8 preconditions already assume "a logged-in user"), so no dedicated test
    is written for it, but the middleware is necessary for AC7/AC8's
    ownership semantics to mean anything.
  - |
    A delete attempt on another user's address returns `404` (indistinguishable
    from a nonexistent id) rather than `403`, matching `requireExpense.js`'s
    existing not-found convention and avoiding confirming to a caller that a
    given id belongs to someone else.

package_dependencies: []

notes: |
  This mirrors the expense list/edit/delete-confirm/delete feature shipped in
  MT-STORY-079 (`11f64f5`) as closely as possible: same page-composition
  style (`renderLayout` + `.card`/`.post` markup), same delete-confirmation
  route shape (`GET .../delete-confirm` + `POST .../delete`), and the same
  "404 via a `require<Resource>` middleware" convention as `requireExpense.js`.
  The one structural addition is ownership scoping, which has no precedent in
  the expense feature (`tests/expenses.test.js`'s own "AC7" for that story
  explicitly documents that expenses have *no* auth/ownership checks) — so
  `requireWebUser` and `requireOwnAddress` are new rather than reused.

  ```mermaid
  flowchart TD
    webjs[src/routes/web.js]
    reqWebUser[src/middleware/requireWebUser.js]
    reqOwnAddr[src/middleware/requireOwnAddress.js]
    addrStore[src/store/addressStore.js]
    addrPage[src/views/pages/addressesPage.js]
    addrConfirmPage[src/views/pages/addressDeleteConfirmPage.js]
    sessionStore[src/store/sessionStore.js]
    userStore[src/store/userStore.js]
    cookies[src/utils/cookies.js]
    layout[src/views/layout.js]

    webjs -->|"GET/POST /addresses* routes"| reqWebUser
    reqWebUser -->|"validate + touch session"| sessionStore
    reqWebUser -->|"resolve req.user"| userStore
    reqWebUser -->|"parse sessionToken cookie"| cookies
    reqWebUser --> reqOwnAddr
    reqOwnAddr -->|"404 if missing or userId mismatch"| addrStore
    webjs -->|"list/remove for req.user.id"| addrStore
    webjs --> addrPage
    webjs --> addrConfirmPage
    addrPage --> layout
    addrConfirmPage --> layout

    classDef touched fill:#f96,color:#000;
    class webjs,reqWebUser,reqOwnAddr,addrStore,addrPage,addrConfirmPage touched;
  ```
