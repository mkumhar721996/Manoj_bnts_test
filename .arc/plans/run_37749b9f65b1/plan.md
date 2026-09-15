summary: |
  Add an inline, guest-only account-creation prompt to the pizza-ordering flow's order
  confirmation screen (`src/views/pages/checkoutPage.js`, rendered today by `POST /checkout`
  in `src/routes/web.js` — the only "just placed an order" screen this app has). A guest who
  just checked out can enter name/phone/email, receive an OTP (stubbed outboxes, mirroring the
  existing `emailService`/`verificationTokenStore` pattern), verify it to create an account,
  have that order's delivery address saved to the new account, and be signed into a normal
  session so that address is prefilled the next time they load `/cart` while logged in. Guests
  who ignore or dismiss the prompt keep seeing their order details and no account is created.
  Duplicate email/phone submissions are rejected inline with a "log in instead" message.

scope:
  - description: |
      Add `phone` and `savedAddress` support to the shared user record and a phone lookup,
      so an inline-created account can be matched for duplicates (AC8) and can carry a saved
      delivery address (AC4/AC9).

      New helper: `findByPhone(phone)` alongside the existing `findByEmail`/`findById`:
      ```js
      function findByPhone(phone) {
        for (const user of users.values()) {
          if (user.phone === phone) return user;
        }
        return undefined;
      }
      ```
      `phone` and `savedAddress` are just additional optional properties on the plain user
      object passed to the existing `save(user)` — no schema/migration exists in this codebase
      to update.
    files:
      - src/store/userStore.js
    rationale: |
      `userStore` currently only tracks id/name/email/passwordHash/verified. AC8's duplicate
      check needs to search by phone too, and AC4/AC9 need somewhere on the account to persist
      the delivery address from the just-placed order.

  - description: |
      New `orderStore` to give each submitted delivery-details form a stable `orderId` that the
      confirmation screen, the "create account" step, and the "verify OTP" step can all refer
      back to (so the just-placed order's address can be re-displayed and later copied onto the
      new account).
      ```js
      function create({ streetAddress, aptSuite, deliveryInstructions }) {
        const order = { id: crypto.randomUUID(), streetAddress, aptSuite, deliveryInstructions };
        orders.set(order.id, order);
        return order;
      }
      function findById(id) { return orders.get(id); }
      ```
    files:
      - src/store/orderStore.js
    rationale: |
      Nothing in the app currently persists a placed order — `POST /checkout` just re-renders
      the submitted fields. AC4 ("the delivery address from the just-placed order") requires an
      addressable order record to survive across the create-account and verify-OTP requests.

  - description: |
      New `otpStore` holding at most one pending OTP request per `orderId` (a fresh submit of
      the name/phone/email form overwrites any earlier pending code for that same order).
      ```js
      function create({ orderId, name, phone, email }) {
        const code = crypto.randomInt(100000, 1000000).toString();
        const record = { orderId, name, phone, email, code, used: false };
        requests.set(orderId, record);
        return record;
      }
      function findByOrderId(orderId) { return requests.get(orderId); }
      function markUsed(orderId) {
        const record = requests.get(orderId);
        if (record) record.used = true;
      }
      ```
    files:
      - src/store/otpStore.js
    rationale: |
      AC2/AC3/AC6 need a place to stash the pending name/phone/email/code between the
      "create-account" (send OTP) request and the "verify-otp" request, keyed by the order so
      the confirmation screen for that order can be re-rendered consistently.

  - description: |
      New `smsService` outbox stub, mirroring `src/services/emailService.js`'s existing
      `outbox`/`sendVerificationEmail`/`getLastEmailTo` shape, plus a new `sendOtpEmail` on the
      existing email service. Neither calls a real provider — same "stub outbox" convention
      already used for verification emails.
      ```js
      // smsService.js
      function sendOtpSms(phone, code) { outbox.push({ to: phone, code }); }
      function getLastSmsTo(phone) { /* mirrors getLastEmailTo */ }
      ```
      ```js
      // emailService.js addition
      function sendOtpEmail(email, code) {
        outbox.push({ to: email.toLowerCase(), code });
      }
      ```
    files:
      - src/services/smsService.js
      - src/services/emailService.js
    rationale: |
      AC2 requires an OTP to be sent to "the provided phone number or email"; both are always
      collected together in this prompt (see assumptions), so both channels are stubbed and
      both are sent to, matching the codebase's existing pattern of never integrating a real
      SMTP/SMS provider (`verificationTokenStore` + `emailService` already work this way).

  - description: |
      New validator for the inline prompt's three fields, following the existing
      `webRegistrationValidator`/`deliveryDetailsValidator` "return `{ errors: [], ...fields }`"
      convention (collect *all* failing messages, don't short-circuit).
      ```js
      function validate(payload) {
        const errors = [];
        // name required; phone required + `/^\+?[0-9]{7,15}$/`; email required + basic shape
        return { errors, name, phone, email };
      }
      ```
    files:
      - src/validation/accountPromptValidator.js
    rationale: |
      AC2 needs the three fields validated before an OTP is ever sent, and AC8's duplicate
      check needs a normalized `email`/`phone` to look up.

  - description: |
      Rewrite `checkoutPage.js` to render the order-confirmation card (unchanged content) plus
      an optional inline account-prompt card, driven by a new `accountPrompt` param with three
      phases.
      Signature change:
      ```js
      // before
      function renderCheckoutPage({ streetAddress, aptSuite, deliveryInstructions })
      // after
      function renderCheckoutPage({ order, isGuest, accountPrompt })
      // accountPrompt: { phase: 'form' | 'otp' | 'success', errors = [], values = {} } | undefined
      ```
      - `phase: 'form'` — name/phone/email form, posting to
        `/checkout/${order.id}/create-account`, an `<a class="back-link" href="/cart">Not now</a>`
        dismiss link, and an `.alert-danger` block when `errors.length > 0` (AC1, AC7, AC8's
        error surface, AC2's own validation errors).
      - `phase: 'otp'` — a single code field posting to `/checkout/${order.id}/verify-otp`, plus
        `.alert-danger` on `errors.length > 0` (AC6).
      - `phase: 'success'` — a `.alert-success` "Account created! Your delivery address has been
        saved for next time." (AC5).
      - `accountPrompt` is entirely omitted (no card rendered) when `isGuest` is `false` (AC1's
        "shown to a guest user" gate).
      No new CSS is introduced — reuses the existing shared `.card`/`.field`/`.field-error`/
      `.alert`/`.btn`/`.back-link` classes from `src/views/layout.js` (see assumptions: no design
      source exists for this screen).
    files:
      - src/views/pages/checkoutPage.js
    rationale: |
      This is the screen all 9 ACs describe — it needs to hold both the pre-existing order
      details and the new prompt's three states in one place, matching this codebase's existing
      "one view function per screen, state passed in as params" convention (`cartPage.js`,
      `registrationErrorPage.js`, etc.).

  - description: |
      Extend `src/routes/web.js`: a small `resolveSessionUser(req)` helper (same
      cookie-parsing + `sessionStore.isActive` check `requireGameSession` already uses, but
      non-blocking — returns `undefined` for a guest instead of redirecting); prefill `GET
      /cart` from a logged-in user's `savedAddress`; have `POST /checkout` create an
      `orderStore` record and decide `isGuest`; add the two new POST routes for the prompt.
      ```js
      router.get('/cart', (req, res) => {
        const user = resolveSessionUser(req);
        res.type('html').send(renderCartPage({ values: (user && user.savedAddress) || {} }));
      });

      router.post('/checkout', (req, res) => {
        // ...existing validation unchanged...
        const order = orderStore.create({ streetAddress, aptSuite, deliveryInstructions });
        const isGuest = !resolveSessionUser(req);
        return res.status(200).type('html').send(
          renderCheckoutPage({ order, isGuest, accountPrompt: isGuest ? { phase: 'form' } : undefined })
        );
      });

      router.post('/checkout/:orderId/create-account', (req, res) => {
        const order = orderStore.findById(req.params.orderId);
        if (!order) return res.status(404).send('Order not found');
        const { errors, name, phone, email } = validateAccountPrompt(req.body || {});
        if (errors.length === 0 && (userStore.findByEmail(email) || userStore.findByPhone(phone))) {
          errors.push('An account with this email or phone number already exists. Please log in instead.');
        }
        if (errors.length > 0) {
          return res.status(400).type('html').send(
            renderCheckoutPage({ order, isGuest: true, accountPrompt: { phase: 'form', errors, values: { name, phone, email } } })
          );
        }
        const otp = otpStore.create({ orderId: order.id, name, phone, email });
        smsService.sendOtpSms(phone, otp.code);
        emailService.sendOtpEmail(email, otp.code);
        return res.status(200).type('html').send(
          renderCheckoutPage({ order, isGuest: true, accountPrompt: { phase: 'otp' } })
        );
      });

      router.post('/checkout/:orderId/verify-otp', (req, res) => {
        const order = orderStore.findById(req.params.orderId);
        if (!order) return res.status(404).send('Order not found');
        const otpRequest = otpStore.findByOrderId(order.id);
        const submittedCode = typeof (req.body || {}).code === 'string' ? req.body.code.trim() : '';
        if (!otpRequest || otpRequest.used || submittedCode !== otpRequest.code) {
          return res.status(400).type('html').send(
            renderCheckoutPage({ order, isGuest: true, accountPrompt: { phase: 'otp', errors: ["That code doesn't match. Please try again."] } })
          );
        }
        otpStore.markUsed(order.id);
        const user = {
          id: crypto.randomUUID(),
          name: otpRequest.name,
          email: otpRequest.email,
          phone: otpRequest.phone,
          passwordHash: null,
          verified: true,
          savedAddress: { streetAddress: order.streetAddress, aptSuite: order.aptSuite, deliveryInstructions: order.deliveryInstructions },
        };
        userStore.save(user);
        const sessionToken = sessionStore.create(user.id);
        res.cookie('sessionToken', sessionToken, { httpOnly: true });
        return res.status(200).type('html').send(
          renderCheckoutPage({ order, isGuest: true, accountPrompt: { phase: 'success' } })
        );
      });
      ```
    files:
      - src/routes/web.js
    rationale: |
      This is where every AC's server-side behaviour lives: guest gating (AC1/AC7), OTP
      send (AC2), OTP verify + account + address save (AC3/AC4/AC5), retry on wrong code
      (AC6), duplicate rejection (AC8), and session issuance + `/cart` prefill for the next
      order (AC9).

tests:
  - |
    AC1 — `tests/postOrderAccountCreation.test.js`, new file. `POST /checkout` as a guest
    (no cookie) with a valid address shows the order details *and* the prompt:
    ```js
    const res = await request(app).post('/checkout').type('form')
      .send({ streetAddress: '500 Main Street', aptSuite: 'Apt 2', deliveryInstructions: 'Leave at door' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('500 Main Street');
    expect(res.text).toContain('id="account-prompt"');
    expect(res.text).toMatch(/<input[^>]*name="name"[^>]*>/);
    expect(res.text).toMatch(/<input[^>]*name="phone"[^>]*>/);
    expect(res.text).toMatch(/<input[^>]*name="email"[^>]*>/);
    ```
    Minimal code: `orderStore.js`, `checkoutPage.js`'s `phase: 'form'` card, `POST /checkout`
    computing `isGuest` and passing `accountPrompt`.

  - |
    AC2 — submitting the prompt form sends an OTP to both channels and shows the code entry
    form:
    ```js
    const checkoutRes = await request(app).post('/checkout').type('form').send({ streetAddress: '12 Oak St' });
    const orderId = extractOrderId(checkoutRes.text);
    const res = await request(app).post(`/checkout/${orderId}/create-account`).type('form')
      .send({ name: 'Sam Lee', phone: '+15551234567', email: 'sam@example.com' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="account-prompt"');
    expect(smsService.getLastSmsTo('+15551234567')).toBeDefined();
    expect(emailService.getLastEmailTo('sam@example.com')).toBeDefined();
    ```
    Minimal code: `otpStore.js`, `smsService.js`, `emailService.sendOtpEmail`,
    `accountPromptValidator.js`, the `create-account` route, `checkoutPage.js`'s `phase: 'otp'`
    card.

  - |
    AC3/AC4 — the correct OTP creates the account and copies the order's address onto it:
    ```js
    const checkoutRes = await request(app).post('/checkout').type('form')
      .send({ streetAddress: '77 Elm St', aptSuite: 'Unit 5', deliveryInstructions: 'Call on arrival' });
    const orderId = extractOrderId(checkoutRes.text);
    await request(app).post(`/checkout/${orderId}/create-account`).type('form')
      .send({ name: 'Sam Lee', phone: '+15551234567', email: 'sam2@example.com' });
    const { code } = otpStore.findByOrderId(orderId);
    const res = await request(app).post(`/checkout/${orderId}/verify-otp`).type('form').send({ code });
    expect(res.status).toBe(200);
    const user = userStore.findByEmail('sam2@example.com');
    expect(user).toBeDefined();
    expect(user.savedAddress).toEqual({ streetAddress: '77 Elm St', aptSuite: 'Unit 5', deliveryInstructions: 'Call on arrival' });
    ```
    Minimal code: `verify-otp` route's success branch.

  - |
    AC5 — the same successful verify-otp response shows a success message:
    ```js
    expect(res.text).toContain('Account created! Your delivery address has been saved for next time.');
    ```
    (same request/response as the AC3/AC4 test above; asserted in the same `it`).
    Minimal code: `checkoutPage.js`'s `phase: 'success'` card.

  - |
    AC6 — an incorrect OTP shows an inline error, allows retry, and creates no account:
    ```js
    const checkoutRes = await request(app).post('/checkout').type('form').send({ streetAddress: '9 Pine St' });
    const orderId = extractOrderId(checkoutRes.text);
    await request(app).post(`/checkout/${orderId}/create-account`).type('form')
      .send({ name: 'Ana', phone: '+15559876543', email: 'ana@example.com' });
    const res = await request(app).post(`/checkout/${orderId}/verify-otp`).type('form').send({ code: '000000' });
    expect(res.status).toBe(400);
    expect(res.text).toContain("That code doesn't match. Please try again.");
    expect(res.text).toContain('id="account-prompt"');
    expect(userStore.findByEmail('ana@example.com')).toBeUndefined();
    ```
    Minimal code: `verify-otp` route's failure branch re-rendering `phase: 'otp'` with `errors`.

  - |
    AC7 — ignoring the prompt (never submitting it) leaves the order details and dismiss link
    visible with no account created:
    ```js
    const res = await request(app).post('/checkout').type('form').send({ streetAddress: '3 Birch Ave' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('3 Birch Ave');
    expect(res.text).toContain('Not now');
    ```
    Minimal code: the `phase: 'form'` card's dismiss `<a class="back-link" href="/cart">Not now</a>`;
    no server-side account creation is reachable without a `create-account`/`verify-otp` POST,
    so "no account created" holds by construction once those routes only create a user in their
    success branch.

  - |
    AC8 — an email or phone that already has an account is rejected inline, and no OTP is sent:
    ```js
    userStore.save({ id: 'existing-1', name: 'Existing User', email: 'dup@example.com', phone: '+15550001111', passwordHash: null, verified: true });
    const checkoutRes = await request(app).post('/checkout').type('form').send({ streetAddress: '44 Cedar Ct' });
    const orderId = extractOrderId(checkoutRes.text);
    const res = await request(app).post(`/checkout/${orderId}/create-account`).type('form')
      .send({ name: 'New Guy', phone: '+15552223333', email: 'dup@example.com' });
    expect(res.status).toBe(400);
    expect(res.text).toContain('An account with this email or phone number already exists. Please log in instead.');
    expect(otpStore.findByOrderId(orderId)).toBeUndefined();
    ```
    Minimal code: the duplicate-check block in the `create-account` route.

  - |
    AC9 — after inline account creation, the saved address is prefilled at `/cart` on a later
    request made with the same (now logged-in) session:
    ```js
    const agent = request.agent(app);
    const checkoutRes = await agent.post('/checkout').type('form')
      .send({ streetAddress: '200 Saved Ln', aptSuite: 'Suite 9', deliveryInstructions: 'Ring bell' });
    const orderId = extractOrderId(checkoutRes.text);
    await agent.post(`/checkout/${orderId}/create-account`).type('form')
      .send({ name: 'Lee', phone: '+15554445555', email: 'lee@example.com' });
    const { code } = otpStore.findByOrderId(orderId);
    await agent.post(`/checkout/${orderId}/verify-otp`).type('form').send({ code });

    const cartRes = await agent.get('/cart');
    expect(cartRes.text).toContain('value="200 Saved Ln"');
    expect(cartRes.text).toContain('value="Suite 9"');

    const secondCheckoutRes = await agent.post('/checkout').type('form').send({ streetAddress: '200 Saved Ln' });
    expect(secondCheckoutRes.text).not.toContain('id="account-prompt"');
    ```
    Minimal code: `verify-otp` issuing a `sessionToken` cookie via `sessionStore.create`, and
    `GET /cart` / `resolveSessionUser`'s `isGuest` gate in `POST /checkout`.

assumptions_or_open_questions:
  - "No design file exists for this story (no `.arc/designs/*087*`, and `design-context.json` only covers the cart page). The prompt/OTP/success cards reuse the existing shared `.card`/`.field`/`.alert`/`.btn`/`.back-link` classes from `src/views/layout.js` with no new visual design — flagging for design sign-off before this ships."
  - "Treated `src/views/pages/checkoutPage.js` (rendered by `POST /checkout` today) as \"the order confirmation screen\" — this codebase has no separate, later payment-complete step; this is the only post-order screen that exists."
  - "AC2 says the OTP is sent 'to the provided phone number or email' while also requiring all three fields (name, phone, email) be entered together. Assumed the OTP is sent to *both* channels (new `smsService` stub + `emailService.sendOtpEmail`) with the same code, rather than picking one — flagging for confirmation of the intended single-channel-vs-both behavior."
  - "Accounts created via this flow have no password (`passwordHash: null`) since only name/phone/email/OTP are collected. To make AC9 (\"places a subsequent order while logged in\") satisfiable at all, `verify-otp`'s success response signs the user into a normal `sessionStore` session immediately (same cookie mechanism as the existing website login). This story does not build any way for that account to log back in in a *later*, separate browser session (no password, no phone-based login) — flagging as a real gap for a follow-up story, since as scoped an OTP-created account can only ever be \"logged in\" by carrying forward the cookie from the moment it was created."
  - "\"Guest\" vs \"logged in\" is determined purely by whether the request carries a valid `sessionToken` cookie (`sessionStore.isActive`), mirroring `requireGameSession`'s check but non-blocking. A request with no/expired session cookie is always treated as a guest for AC1/AC7's gating, even though this app never issues that cookie from anywhere except the Facebook-clone website login and this story's own `verify-otp` step."
  - "`otpStore` keeps at most one pending OTP request per `orderId`; resubmitting the name/phone/email form for the same order overwrites the previous pending code. No AC requires supporting multiple concurrent OTP attempts per order."
  - "No OTP expiry/attempt-limit is implemented — none of the 9 ACs mention a time limit or lockout, only correct-vs-incorrect code entry, so this stays out of scope rather than being spun up speculatively."

package_dependencies: []

notes: |
  This app is a shared Express codebase hosting several unrelated demo verticals behind one
  `src/app.js` (a Facebook-style registration/login clone under `tests/web.test.js`, an expense
  tracker, a spin/wallet game, and this pizza cart/checkout flow) — `userStore`, `sessionStore`,
  `emailService`, `cookies.js`, and `escapeHtml.js` are the only pieces shared across verticals,
  and this plan only adds to that shared surface (new `phone`/`savedAddress` fields, a new
  `findByPhone`) without touching the Facebook-clone's own `/register`/`/login` contract or its
  passing tests.

  ```mermaid
  flowchart TD
    classDef touched fill:#f96,color:#000
    classDef new fill:#bbf,color:#000

    Web["src/routes/web.js"]:::touched
    CheckoutPage["src/views/pages/checkoutPage.js"]:::touched
    CartPage["src/views/pages/cartPage.js"]
    UserStore["src/store/userStore.js"]:::touched
    OrderStore["src/store/orderStore.js"]:::new
    OtpStore["src/store/otpStore.js"]:::new
    SmsService["src/services/smsService.js"]:::new
    EmailService["src/services/emailService.js"]:::touched
    SessionStore["src/store/sessionStore.js"]
    AccountPromptValidator["src/validation/accountPromptValidator.js"]:::new
    DeliveryValidator["src/validation/deliveryDetailsValidator.js"]

    Web -->|"GET /cart: prefill from session user's savedAddress"| SessionStore
    Web -->|"GET /cart: render form"| CartPage
    Web -->|"POST /checkout: validate address"| DeliveryValidator
    Web -->|"POST /checkout: create order record"| OrderStore
    Web -->|"render confirmation + prompt when isGuest"| CheckoutPage
    Web -->|"POST .../create-account: validate fields"| AccountPromptValidator
    Web -->|"POST .../create-account: duplicate check"| UserStore
    Web -->|"POST .../create-account: store pending code"| OtpStore
    Web -->|"POST .../create-account: send OTP"| SmsService
    Web -->|"POST .../create-account: send OTP"| EmailService
    Web -->|"POST .../verify-otp: check code"| OtpStore
    Web -->|"POST .../verify-otp: create account + save address"| UserStore
    Web -->|"POST .../verify-otp: issue session cookie"| SessionStore
  ```
