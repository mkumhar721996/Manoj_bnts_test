summary: |
  Add OTP-based sign-up and log-in (email or phone, no password) so users can create an
  account or authenticate without a password, per MT-STORY-088. The codebase already has a
  fully-tested, password-based sign-up/login system (`/register`, `/login` web routes and
  `/api/register`, `/api/login`, `/api/verify-email` JSON API, from earlier stories
  MT-STORY-019/020/024) whose contract conflicts with this story's ACs (no password, phone
  allowed, OTP instead of a verification link). Rather than repurpose or weaken that
  already-shipped, tested surface, this plan adds a new, self-contained `/otp/*` route
  surface that reuses the existing in-memory `userStore` (so identities stay unique across
  both auth methods, matching the story's stated purpose of reusing saved account data at
  checkout) and the existing `sessionStore` + `sessionToken` cookie mechanism already used by
  the `/game` route (MT-STORY-055), so logging in via OTP grants the same kind of session as
  the existing password login. Beyond the 10 literal ACs, this revision adds explicit
  edge-case coverage (expired/replayed/cross-purpose OTPs, malformed input, identifier
  normalization, duplicate sign-up, session-less logout) mirroring the depth of edge-case
  testing already present in this codebase's `verification.test.js` and `login.test.js`.

scope:
  - description: |
      New identifier validator that classifies a submitted value as an email or a phone
      number (or rejects it), normalizing the value for storage/lookup.

      New file `src/validation/identifierValidator.js`:
      ```js
      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

      function validate(payload) {
        const raw = typeof payload.identifier === 'string' ? payload.identifier.trim() : '';

        if (!raw) {
          return { valid: false, error: 'Enter your phone number or email address.' };
        }
        if (EMAIL_REGEX.test(raw)) {
          return { valid: true, type: 'email', value: raw.toLowerCase() };
        }
        const digitsOnly = raw.replace(/[\s-]/g, '');
        if (PHONE_REGEX.test(digitsOnly)) {
          return { valid: true, type: 'phone', value: digitsOnly };
        }
        return { valid: false, error: 'Enter a valid phone number or email address.' };
      }

      module.exports = { validate };
      ```
    files:
      - src/validation/identifierValidator.js
    rationale: |
      AC1/AC5 require prompting for "phone number or email"; downstream code (OTP store,
      account creation) needs to know which kind of identifier it has and a normalized value
      to key stores/lookups by. Normalizing phone punctuation (spaces/dashes) and email case
      here, before any store is touched, is what makes the identifier-normalization edge case
      tests below pass without duplicating normalization logic in every route handler.

  - description: |
      New in-memory OTP store, modeled on the existing `verificationTokenStore.js` pattern
      (same shape of `create`/`find`/`markUsed`/`expire`/`reset`, same `expireTokenRecord`
      helper), but keyed by `purpose:identifier` and storing a short numeric code instead of a
      UUID link token. Creating a new OTP for the same `(identifier, purpose)` overwrites the
      previous record (a `Map.set` on the same key), which is the mechanism that makes
      "requesting a new code invalidates the old one" and "OTPs are isolated per purpose"
      hold without extra code.

      New file `src/store/otpStore.js`:
      ```js
      const crypto = require('crypto');
      const { expireTokenRecord } = require('../utils/expireTokenRecord');

      const OTP_TTL_MS = 5 * 60 * 1000;

      let otps = new Map();

      function reset() { otps = new Map(); }

      function key(identifier, purpose) {
        return `${purpose}:${identifier.toLowerCase()}`;
      }

      function create(identifier, purpose, type) {
        const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
        otps.set(key(identifier, purpose), {
          code, type, purpose,
          expiresAt: Date.now() + OTP_TTL_MS,
          used: false,
        });
        return code;
      }

      function find(identifier, purpose) {
        return otps.get(key(identifier, purpose));
      }

      function markUsed(identifier, purpose) {
        const record = find(identifier, purpose);
        if (record) record.used = true;
      }

      function expire(identifier, purpose) {
        expireTokenRecord(otps, key(identifier, purpose));
      }

      module.exports = { create, find, markUsed, expire, reset };
      ```
    files:
      - src/store/otpStore.js
    rationale: |
      AC2/AC6 require an OTP to be generated and sent; AC3/AC4/AC7 require verifying it;
      AC8/AC9 require rejecting a wrong code while letting the user retry (so a failed
      attempt must not mark the code used or delete it). Keying by `purpose:identifier`
      (rather than just `identifier`) is what makes a signup code and a login code for the
      same identifier independent, which the cross-purpose-isolation edge case test below
      depends on.

  - description: |
      OTP delivery: a new `smsService.js` (in-memory outbox stub, mirroring
      `emailService.js`'s existing outbox pattern) for phone identifiers, an added
      `sendOtpEmail`/`getLastOtpEmailTo` pair on the existing `emailService.js` for email
      identifiers, and a thin `otpService.js` that dispatches to whichever is needed.

      New file `src/services/smsService.js`:
      ```js
      let outbox = [];
      function reset() { outbox = []; }
      function sendOtpSms(phone, code) { outbox.push({ to: phone, code }); }
      function getLastSmsTo(phone) {
        for (let i = outbox.length - 1; i >= 0; i -= 1) {
          if (outbox[i].to === phone) return outbox[i];
        }
        return undefined;
      }
      module.exports = { sendOtpSms, getLastSmsTo, reset };
      ```

      Added to `src/services/emailService.js` (existing `sendVerificationEmail`/
      `getLastEmailTo`/`reset` stay unchanged):
      ```js
      function sendOtpEmail(email, code) {
        outbox.push({ to: email.toLowerCase(), code });
      }
      function getLastOtpEmailTo(email) {
        const target = email.toLowerCase();
        for (let i = outbox.length - 1; i >= 0; i -= 1) {
          if (outbox[i].to === target && outbox[i].code !== undefined) return outbox[i];
        }
        return undefined;
      }
      module.exports = { sendVerificationEmail, getLastEmailTo, sendOtpEmail, getLastOtpEmailTo, reset };
      ```

      New file `src/services/otpService.js`:
      ```js
      const emailService = require('./emailService');
      const smsService = require('./smsService');

      function sendOtp(type, identifier, code) {
        if (type === 'email') {
          emailService.sendOtpEmail(identifier, code);
        } else {
          smsService.sendOtpSms(identifier, code);
        }
      }

      module.exports = { sendOtp };
      ```
    files:
      - src/services/smsService.js
      - src/services/emailService.js
      - src/services/otpService.js
    rationale: |
      AC2 ("an OTP is sent to the provided phone number or email") and AC6 ("an OTP is sent to
      the registered contact") need an actual dispatch step; reusing/extending the existing
      outbox-stub convention keeps this testable the same way `verification.test.js` already
      tests `emailService.getLastEmailTo`.

  - description: |
      Generalize `userStore` to support a phone-only identity (current `save` crashes on
      `user.email.toLowerCase()` if there is no email) and add a type-agnostic lookup, without
      changing `findByEmail`'s existing behavior/signature (still used by the password flows
      and their tests in `tests/registration.test.js`, `tests/login.test.js`,
      `tests/verification.test.js`, `tests/web.test.js`).

      `src/store/userStore.js` before → after:
      ```js
      // before
      function save(user) {
        users.set(user.email.toLowerCase(), user);
      }

      // after
      function save(user) {
        const key = user.email || user.phone;
        users.set(key.toLowerCase(), user);
      }

      function findByIdentifier(identifier) {
        return users.get(identifier.toLowerCase());
      }
      ```
      `findByIdentifier` and `save` are added to `module.exports` alongside the existing
      `findByEmail`, `findById`, `reset`.
    files:
      - src/store/userStore.js
    rationale: |
      AC3 creates an account from a phone-or-email identifier; storing OTP-created users in
      the same shared `userStore` (rather than a separate store) keeps a single source of
      truth for "users", which is what the story's stated goal (reusing saved data at
      checkout) implies, while the one-line `save` change is backward-compatible for every
      existing email-only caller/test.

  - description: |
      New sign-up route surface under a dedicated `/otp` prefix (kept separate from the
      existing `/register`/`/api/register` paths so this story cannot regress
      `tests/registration.test.js`, `tests/web.test.js`, `tests/verification.test.js`):
      `GET /otp/signup` (identifier prompt, AC1), `POST /otp/signup` (validates + sends OTP,
      AC2), `POST /otp/signup/verify` (creates the account and logs the user in on a correct
      code — AC3/AC4 — or re-renders the code page with an inline error and no state change on
      an incorrect one — AC8/AC9; also handles an unknown identifier/purpose, an expired
      record, and a replayed already-used code, all via the same guard clause).

      New file `src/routes/otpAuth.js` (signup handlers; login/logout handlers described in
      the next two scope items live in the same file/router):
      ```js
      router.get('/signup', (req, res) => {
        res.type('html').send(renderOtpIdentifierPage({ mode: 'signup' }));
      });

      router.post('/signup', (req, res) => {
        const result = validateIdentifier(req.body || {});
        if (!result.valid) {
          return res.status(400).type('html').send(
            renderOtpIdentifierPage({ mode: 'signup', error: result.error, value: req.body.identifier })
          );
        }
        const code = otpStore.create(result.value, 'signup', result.type);
        otpService.sendOtp(result.type, result.value, code);
        return res.status(200).type('html').send(renderOtpCodePage({ mode: 'signup', identifier: result.value }));
      });

      router.post('/signup/verify', (req, res) => {
        const { identifier, code } = req.body || {};
        const record = typeof identifier === 'string' ? otpStore.find(identifier, 'signup') : undefined;

        if (!record || record.used || record.expiresAt < Date.now() || record.code !== code) {
          return res.status(400).type('html').send(
            renderOtpCodePage({ mode: 'signup', identifier, error: 'That code is incorrect. Please try again.' })
          );
        }

        otpStore.markUsed(identifier, 'signup');
        let user = userStore.findByIdentifier(identifier);
        if (!user) {
          user = {
            id: crypto.randomUUID(),
            ...(record.type === 'email' ? { email: identifier } : { phone: identifier }),
            verified: true,
          };
          userStore.save(user);
        }

        const sessionToken = sessionStore.create(user.id);
        res.cookie('sessionToken', sessionToken, { httpOnly: true });
        return res.status(201).type('html').send(renderOtpAccountPage({ identifier }));
      });
      ```
    files:
      - src/routes/otpAuth.js
    rationale: |
      Directly implements AC1–AC4, AC8, AC9 for the sign-up half of the story. The single
      guard clause (`!record || record.used || record.expiresAt < Date.now() || record.code
      !== code`) is deliberately one condition covering four distinct edge cases (never sent,
      already used/replayed, expired, wrong digits) so none of them can be special-cased into
      an inconsistent response shape.

  - description: |
      Login half of the same router: `GET /otp/login` (AC5), `POST /otp/login` (only sends an
      OTP when the identifier matches a registered account, per AC6's "match a registered
      account" wording — otherwise shows an inline "no account found" error and sends nothing),
      `POST /otp/login/verify` (AC7 on a correct code, AC8/AC9 on an incorrect one, same
      not-marked-used-on-failure and unknown/expired/replayed handling as signup).
      ```js
      router.get('/login', (req, res) => {
        res.type('html').send(renderOtpIdentifierPage({ mode: 'login' }));
      });

      router.post('/login', (req, res) => {
        const result = validateIdentifier(req.body || {});
        const user = result.valid ? userStore.findByIdentifier(result.value) : undefined;

        if (!result.valid || !user) {
          return res.status(400).type('html').send(
            renderOtpIdentifierPage({
              mode: 'login',
              error: result.valid ? 'No account found for that phone number or email address.' : result.error,
              value: req.body.identifier,
            })
          );
        }

        const code = otpStore.create(result.value, 'login', result.type);
        otpService.sendOtp(result.type, result.value, code);
        return res.status(200).type('html').send(renderOtpCodePage({ mode: 'login', identifier: result.value }));
      });

      router.post('/login/verify', (req, res) => {
        const { identifier, code } = req.body || {};
        const record = typeof identifier === 'string' ? otpStore.find(identifier, 'login') : undefined;

        if (!record || record.used || record.expiresAt < Date.now() || record.code !== code) {
          return res.status(400).type('html').send(
            renderOtpCodePage({ mode: 'login', identifier, error: 'That code is incorrect. Please try again.' })
          );
        }

        otpStore.markUsed(identifier, 'login');
        const user = userStore.findByIdentifier(identifier);
        const sessionToken = sessionStore.create(user.id);
        res.cookie('sessionToken', sessionToken, { httpOnly: true });
        return res.status(200).type('html').send(renderOtpAccountPage({ identifier }));
      });
      ```
    files:
      - src/routes/otpAuth.js
    rationale: |
      Directly implements AC5–AC9 for the log-in half of the story, reusing the exact same
      guard-clause shape as signup so the expired/replayed/unknown-code edge case tests are
      symmetric between the two flows.

  - description: |
      A minimal authenticated landing page rendered after a successful sign-up/login, with a
      real, working log-out control (a `POST` form, not an inert link like the pre-existing
      `feedPage.js`'s "Log Out" anchor), plus the logout route itself which invalidates the
      server-side session and clears the cookie, and tolerates being called with no active
      session (no crash, still redirects home).
      ```js
      router.post('/logout', (req, res) => {
        const cookies = parseCookies(req.headers.cookie);
        if (cookies.sessionToken) {
          sessionStore.expire(cookies.sessionToken);
        }
        res.clearCookie('sessionToken');
        return res.redirect('/');
      });
      ```
      `src/views/pages/otpAccountPage.js` renders a header containing
      `<form action="/otp/logout" method="post"><button type="submit">Log Out</button></form>`.
    files:
      - src/routes/otpAuth.js
      - src/views/pages/otpAccountPage.js
    rationale: |
      AC10 requires a logged-in user to have an accessible log-out option; this reuses the
      existing `sessionStore.expire`/`parseCookies` primitives already proven in
      `requireGameSession.js`. Guarding on `cookies.sessionToken` being present (rather than
      assuming it exists) is what makes the no-session-cookie logout edge case a clean 302
      instead of a thrown error.

  - description: |
      Three new view-rendering files (identifier-prompt page, code-entry page, authenticated
      landing page) shared between the sign-up and log-in flows via a `mode` parameter, styled
      with the existing `renderLayout`/design-token CSS (no new design exists for this story,
      see assumptions), and mounting the new router in `src/app.js` alongside the four existing
      routers (`registrationRouter`, `accountRouter`, `verificationRouter`, `loginRouter`,
      `webRouter`).
    files:
      - src/views/pages/otpIdentifierPage.js
      - src/views/pages/otpCodePage.js
      - src/views/pages/otpAccountPage.js
      - src/app.js
    rationale: |
      Keeps view rendering consistent with the rest of the app (`escapeHtml` on all
      interpolated user input, `renderLayout` wrapper) and wires the new router in without
      touching any of the five existing route registrations in `src/app.js`.

tests:
  - |
    AC1 (`tests/otpSignup.test.js`, new file) — choosing to sign up prompts for phone/email:
    ```js
    describe('AC1: choosing to sign up prompts for phone or email', () => {
      it('renders a form asking for phone number or email address', async () => {
        const res = await request(app).get('/otp/signup');
        expect(res.status).toBe(200);
        expect(res.text).toMatch(/<input[^>]*name="identifier"[^>]*>/);
        expect(res.text).toContain('Phone number or email address');
      });
    });
    ```
  - |
    AC2 (`tests/otpSignup.test.js`) — valid sign-up details trigger an OTP to email or phone:
    ```js
    describe('AC2: valid sign-up details trigger an OTP', () => {
      it('emails a 6-digit OTP for a valid email identifier', async () => {
        const res = await request(app).post('/otp/signup').type('form').send({ identifier: 'new.user@example.com' });
        expect(res.status).toBe(200);
        const sent = emailService.getLastOtpEmailTo('new.user@example.com');
        expect(sent.code).toMatch(/^\d{6}$/);
      });

      it('texts a 6-digit OTP for a valid phone identifier', async () => {
        await request(app).post('/otp/signup').type('form').send({ identifier: '+15551234567' });
        expect(smsService.getLastSmsTo('+15551234567').code).toMatch(/^\d{6}$/);
      });
    });
    ```
  - |
    AC3 (`tests/otpSignup.test.js`) — correct OTP creates a new account:
    ```js
    describe('AC3: correct OTP creates a new account', () => {
      it('creates a verified user record for the identifier', async () => {
        const identifier = 'created.user@example.com';
        await request(app).post('/otp/signup').type('form').send({ identifier });
        const { code } = emailService.getLastOtpEmailTo(identifier);

        const res = await request(app).post('/otp/signup/verify').type('form').send({ identifier, code });

        expect(res.status).toBe(201);
        const user = userStore.findByIdentifier(identifier);
        expect(user).toBeDefined();
        expect(user.verified).toBe(true);
      });
    });
    ```
  - |
    AC4 (`tests/otpSignup.test.js`) — correct OTP logs the user in (session cookie issued):
    ```js
    describe('AC4: correct OTP logs the user in', () => {
      it('sets a sessionToken cookie after account creation', async () => {
        const identifier = 'login.after.signup@example.com';
        await request(app).post('/otp/signup').type('form').send({ identifier });
        const { code } = emailService.getLastOtpEmailTo(identifier);

        const res = await request(app).post('/otp/signup/verify').type('form').send({ identifier, code });

        expect(res.headers['set-cookie'].some((c) => c.startsWith('sessionToken='))).toBe(true);
      });
    });
    ```
  - |
    AC5 (`tests/otpLogin.test.js`, new file) — choosing to log in prompts for registered phone/email:
    ```js
    describe('AC5: choosing to log in prompts for a registered phone or email', () => {
      it('renders a form asking for phone number or email address', async () => {
        const res = await request(app).get('/otp/login');
        expect(res.status).toBe(200);
        expect(res.text).toMatch(/<input[^>]*name="identifier"[^>]*>/);
      });
    });
    ```
  - |
    AC6 (`tests/otpLogin.test.js`) — log-in details matching a registered account trigger an
    OTP (and a non-matching identifier does not):
    ```js
    describe('AC6: matching log-in details trigger an OTP', () => {
      it('sends an OTP to the registered email', async () => {
        const identifier = 'registered.user@example.com';
        userStore.save({ id: crypto.randomUUID(), email: identifier, verified: true });

        const res = await request(app).post('/otp/login').type('form').send({ identifier });

        expect(res.status).toBe(200);
        expect(emailService.getLastOtpEmailTo(identifier).code).toMatch(/^\d{6}$/);
      });

      it('sends no OTP and shows an inline error for an unregistered identifier', async () => {
        const res = await request(app).post('/otp/login').type('form').send({ identifier: 'nobody@example.com' });

        expect(res.status).toBe(400);
        expect(emailService.getLastOtpEmailTo('nobody@example.com')).toBeUndefined();
        expect(res.text).toMatch(/no account found/i);
      });
    });
    ```
  - |
    AC7 (`tests/otpLogin.test.js`) — correct OTP on login logs the user in:
    ```js
    describe('AC7: correct OTP logs the user in', () => {
      it('sets a sessionToken cookie for a registered identifier', async () => {
        const identifier = 'existing.user@example.com';
        userStore.save({ id: crypto.randomUUID(), email: identifier, verified: true });
        await request(app).post('/otp/login').type('form').send({ identifier });
        const { code } = emailService.getLastOtpEmailTo(identifier);

        const res = await request(app).post('/otp/login/verify').type('form').send({ identifier, code });

        expect(res.status).toBe(200);
        expect(res.headers['set-cookie'].some((c) => c.startsWith('sessionToken='))).toBe(true);
      });
    });
    ```
  - |
    AC8 (`tests/otpSignup.test.js` and `tests/otpLogin.test.js`) — incorrect OTP shows an
    inline error:
    ```js
    describe('AC8: incorrect OTP shows an inline error', () => {
      it('shows an inline error and creates no account for a wrong code', async () => {
        const identifier = 'wrong.code@example.com';
        await request(app).post('/otp/signup').type('form').send({ identifier });

        const res = await request(app).post('/otp/signup/verify').type('form').send({ identifier, code: '000000' });

        expect(res.status).toBe(400);
        expect(res.text).toContain('field-error');
        expect(res.text).toMatch(/incorrect/i);
        expect(userStore.findByIdentifier(identifier)).toBeUndefined();
      });
    });
    ```
  - |
    AC9 (`tests/otpSignup.test.js` and `tests/otpLogin.test.js`) — user can retry after an
    incorrect OTP:
    ```js
    describe('AC9: retry after an incorrect OTP succeeds with the right code', () => {
      it('allows a correct second attempt after a wrong first one', async () => {
        const identifier = 'retry.user@example.com';
        await request(app).post('/otp/signup').type('form').send({ identifier });
        const { code } = emailService.getLastOtpEmailTo(identifier);

        await request(app).post('/otp/signup/verify').type('form').send({ identifier, code: '000000' });
        const res = await request(app).post('/otp/signup/verify').type('form').send({ identifier, code });

        expect(res.status).toBe(201);
        expect(userStore.findByIdentifier(identifier)).toBeDefined();
      });
    });
    ```
  - |
    AC10 (`tests/otpLogout.test.js`, new file) — a logged-in user has an accessible log-out
    option that actually ends the session:
    ```js
    describe('AC10: a logged-in user has an accessible, working log-out option', () => {
      it('renders a log-out control on the post-authentication page', async () => {
        const identifier = 'logout.user@example.com';
        await request(app).post('/otp/signup').type('form').send({ identifier });
        const { code } = emailService.getLastOtpEmailTo(identifier);

        const res = await request(app).post('/otp/signup/verify').type('form').send({ identifier, code });

        expect(res.text).toContain('action="/otp/logout"');
        expect(res.text).toContain('>Log Out<');
      });

      it('ends the session and clears the cookie on logout', async () => {
        const agent = request.agent(app);
        const identifier = 'logout2.user@example.com';
        await agent.post('/otp/signup').type('form').send({ identifier });
        const { code } = emailService.getLastOtpEmailTo(identifier);
        await agent.post('/otp/signup/verify').type('form').send({ identifier, code });

        const res = await agent.post('/otp/logout');

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/');
        expect((res.headers['set-cookie'] || []).some((c) => c.startsWith('sessionToken=;'))).toBe(true);
      });
    });
    ```
  - |
    EDGE CASE (`tests/otpSignup.test.js` / `tests/otpLogin.test.js`) — an expired OTP is
    rejected even with the right digits, mirroring `verification.test.js`'s
    `verificationTokenStore.expire` pattern:
    ```js
    describe('edge case: an expired OTP is rejected', () => {
      it('rejects a correct code after the OTP has expired', async () => {
        const identifier = 'expired.otp@example.com';
        await request(app).post('/otp/signup').type('form').send({ identifier });
        const { code } = emailService.getLastOtpEmailTo(identifier);
        otpStore.expire(identifier, 'signup');

        const res = await request(app).post('/otp/signup/verify').type('form').send({ identifier, code });

        expect(res.status).toBe(400);
        expect(userStore.findByIdentifier(identifier)).toBeUndefined();
      });
    });
    ```
  - |
    EDGE CASE (`tests/otpSignup.test.js`) — an already-used (replayed) OTP is rejected on a
    second submission, not just the first wrong one:
    ```js
    describe('edge case: a used OTP cannot be replayed', () => {
      it('rejects the same correct code on a second verify call', async () => {
        const identifier = 'replay.user@example.com';
        await request(app).post('/otp/signup').type('form').send({ identifier });
        const { code } = emailService.getLastOtpEmailTo(identifier);
        await request(app).post('/otp/signup/verify').type('form').send({ identifier, code });

        const res = await request(app).post('/otp/signup/verify').type('form').send({ identifier, code });

        expect(res.status).toBe(400);
      });
    });
    ```
  - |
    EDGE CASE (`tests/otpSignup.test.js`) — requesting a second OTP invalidates the first one:
    ```js
    describe('edge case: requesting a new OTP invalidates the previous code', () => {
      it('rejects the first code once a second has been requested', async () => {
        const identifier = 'refresh.user@example.com';
        await request(app).post('/otp/signup').type('form').send({ identifier });
        const { code: firstCode } = emailService.getLastOtpEmailTo(identifier);

        await request(app).post('/otp/signup').type('form').send({ identifier });

        const res = await request(app).post('/otp/signup/verify').type('form').send({ identifier, code: firstCode });
        expect(res.status).toBe(400);
      });
    });
    ```
  - |
    EDGE CASE (`tests/otpLogin.test.js`) — a signup OTP cannot be used to verify a login (and
    vice versa), since OTPs are keyed by purpose:
    ```js
    describe('edge case: OTPs are isolated per purpose', () => {
      it('rejects a signup code submitted to the login verify endpoint', async () => {
        const identifier = 'cross.purpose@example.com';
        userStore.save({ id: crypto.randomUUID(), email: identifier, verified: true });
        await request(app).post('/otp/signup').type('form').send({ identifier });
        const { code } = emailService.getLastOtpEmailTo(identifier);

        const res = await request(app).post('/otp/login/verify').type('form').send({ identifier, code });

        expect(res.status).toBe(400);
      });
    });
    ```
  - |
    EDGE CASE (`tests/otpSignup.test.js` / `tests/otpLogin.test.js`) — malformed or missing
    identifiers are rejected without crashing and without sending an OTP:
    ```js
    describe('edge case: malformed identifier input', () => {
      it.each([[''], ['not-an-identifier'], ['12345']])('rejects %j with a 400 and no OTP sent', async (identifier) => {
        const res = await request(app).post('/otp/signup').type('form').send({ identifier });
        expect(res.status).toBe(400);
        expect(res.text).toMatch(/valid phone number or email|phone number or email address/i);
      });

      it('rejects a non-string identifier (e.g. an array) without crashing', async () => {
        const res = await request(app).post('/otp/signup').send({ identifier: ['a@b.com'] });
        expect(res.status).toBe(400);
      });

      it('rejects a verify call for an identifier that never had an OTP sent', async () => {
        const res = await request(app)
          .post('/otp/signup/verify')
          .type('form')
          .send({ identifier: 'never.requested@example.com', code: '123456' });
        expect(res.status).toBe(400);
      });
    });
    ```
  - |
    EDGE CASE (`tests/otpLogin.test.js`) — identifier normalization: differently-formatted
    but equivalent identifiers still match a registered account:
    ```js
    describe('edge case: identifier normalization', () => {
      it('matches a registered email regardless of case', async () => {
        userStore.save({ id: crypto.randomUUID(), email: 'case.test@example.com', verified: true });

        const res = await request(app).post('/otp/login').type('form').send({ identifier: 'CASE.TEST@EXAMPLE.COM' });

        expect(res.status).toBe(200);
      });

      it('matches a registered phone number submitted with spaces and dashes', async () => {
        userStore.save({ id: crypto.randomUUID(), phone: '+15551234567', verified: true });

        const res = await request(app).post('/otp/login').type('form').send({ identifier: '+1 555-123-4567' });

        expect(res.status).toBe(200);
      });
    });
    ```
  - |
    EDGE CASE (`tests/otpSignup.test.js`) — signing up again with an already-registered
    identifier logs into the existing account rather than creating a duplicate:
    ```js
    describe('edge case: duplicate sign-up reuses the existing account', () => {
      it('does not create a second user record for an already-registered identifier', async () => {
        const identifier = 'existing.signup@example.com';
        const existing = { id: crypto.randomUUID(), email: identifier, verified: true };
        userStore.save(existing);

        await request(app).post('/otp/signup').type('form').send({ identifier });
        const { code } = emailService.getLastOtpEmailTo(identifier);
        const res = await request(app).post('/otp/signup/verify').type('form').send({ identifier, code });

        expect(res.status).toBe(201);
        expect(userStore.findByIdentifier(identifier).id).toBe(existing.id);
      });
    });
    ```
  - |
    EDGE CASE (`tests/otpLogout.test.js`) — calling logout with no active session does not
    crash and still redirects home:
    ```js
    describe('edge case: logout with no active session', () => {
      it('redirects home without a sessionToken cookie', async () => {
        const res = await request(app).post('/otp/logout');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/');
      });
    });
    ```

assumptions_or_open_questions:
  - |
    No design mockup exists for MT-STORY-088 (checked `.arc/designs/` — only
    `MT-STORY-024-design.html` (existing password auth) and `MT-STORY-030-design.html` (a
    cart/checkout page unrelated to auth) exist). The new `/otp/*` pages are built using the
    existing `renderLayout`/design-token CSS only, with plain, undesigned markup. This should
    be revisited once a real design exists.
  - |
    This story's ACs (no password, phone allowed, OTP not a link) directly conflict with the
    already-shipped, fully-tested password + email-verification-link system (`/register`,
    `/login` web routes and `/api/register`, `/api/login`, `/api/verify-email`, covered by
    `tests/registration.test.js`, `tests/login.test.js`, `tests/verification.test.js`,
    `tests/web.test.js`, `tests/game.test.js`). Rather than replace or branch that contract,
    this plan adds a fully separate `/otp/*` surface so none of those tests are touched. If the
    intent is actually to replace password auth with OTP auth site-wide, that is a much larger
    change (rewriting the homepage, deleting the password routes/tests) and should be called
    out explicitly before implementation starts.
  - |
    No link was added from the existing homepage (`src/views/pages/homePage.js`) to
    `/otp/signup` / `/otp/login` — no AC or design specifies where/how this new flow should be
    surfaced in navigation, and touching the homepage risks interacting with
    `tests/web.test.js`'s exact-content assertions. The new flow is reachable only by direct
    URL until a design decision is made.
  - |
    AC10 ("any page") is interpreted narrowly as "every page this story renders while the user
    is logged in" (currently just `otpAccountPage.js`), not retrofitted onto pre-existing pages
    from other stories (`feedPage.js`, `gamePage.js`, cart/checkout/expenses pages), which don't
    currently branch on logged-in/out state and are out of scope for this story.
  - |
    Signing up again with an identifier that already has an account is treated as logging into
    the existing account (find-or-create in `/otp/signup/verify`), covered explicitly by a new
    edge-case test, rather than an error, since no AC specifies duplicate-signup behavior.
  - |
    Per AC6's literal wording ("match a registered account"), `/otp/login` only sends an OTP
    for a registered identifier and shows an inline "no account found" error otherwise. This
    reveals account existence (a mild enumeration risk, unlike the timing-safe-but-generic
    `/api/login`/`/register` behavior elsewhere in this codebase) but matches the AC as
    written; flagging in case the reviewer wants a generic response instead.
  - |
    OTP format assumed to be 6 numeric digits with a 5-minute expiry and no attempt-count
    lockout/rate limiting (a wrong-guess brute force is only bounded by the 5-minute TTL, and
    requesting a fresh code invalidates the previous one, covered by a new edge-case test). No
    AC calls for throttling, so none is built, but this is a real gap for a production OTP flow.
  - |
    Phone numbers are validated as a loose E.164-like shape (`+` optional, 8-15 digits) and
    "sent" via a new in-memory `smsService` outbox stub — no real SMS provider is integrated,
    mirroring how `emailService` is also just an in-memory stub today.
  - |
    The reviewer asked to "add more ACs and cover edge cases." This plan does not invent new
    formal acceptance criteria (AC ownership belongs to the story/product owner, and the 10
    ACs above are the ones stated on the work item), but it does add a substantial set of
    edge-case tests beyond the 10 literal ACs (expired/replayed/cross-purpose OTPs, malformed
    or non-string input, identifier normalization, duplicate sign-up, session-less logout),
    matching the depth of edge-case coverage already present in this codebase's
    `verification.test.js` and `login.test.js`. If the reviewer specifically wants new
    numbered ACs added to the work item itself, that should happen on the story, not in this
    implementation plan.

package_dependencies: []

notes: |
  This plan follows the precedent already set in this codebase (see the MT-STORY-024 plan at
  `.arc/plans/run_f6f4f289d5f0/plan.md`) of flagging a conflict between a new story's ACs and
  an already-shipped, tested contract rather than silently resolving it by weakening existing
  behavior. All file paths and code patterns referenced below were re-verified against the
  current codebase on this revision (`src/store/userStore.js`, `src/services/emailService.js`,
  `src/store/verificationTokenStore.js`, `src/store/sessionStore.js`, `src/utils/cookies.js`,
  `src/middleware/requireGameSession.js`, `src/utils/expireTokenRecord.js`, `src/app.js`,
  `src/views/layout.js`, `src/routes/web.js`, `src/routes/login.js`, and
  `src/routes/registration.js` all match what this plan assumes).

  The scope touches routing, storage, service, and view layers, so here is how the new pieces
  connect to each other and to the two pieces of existing infrastructure they reuse
  (`sessionStore` and `cookies.js`'s `parseCookies`, both already proven by
  `requireGameSession.js` for the `/game` route):

  ```mermaid
  flowchart TD
    app[src/app.js]
    otpAuth[src/routes/otpAuth.js]
    identifierValidator[src/validation/identifierValidator.js]
    otpStore[src/store/otpStore.js]
    otpService[src/services/otpService.js]
    emailService[src/services/emailService.js]
    smsService[src/services/smsService.js]
    userStore[src/store/userStore.js]
    sessionStore[src/store/sessionStore.js]
    cookies[src/utils/cookies.js]
    idPage[src/views/pages/otpIdentifierPage.js]
    codePage[src/views/pages/otpCodePage.js]
    accountPage[src/views/pages/otpAccountPage.js]
    requireGameSession[src/middleware/requireGameSession.js]

    app -->|mounts new router| otpAuth
    otpAuth -->|classify + normalize phone/email| identifierValidator
    otpAuth -->|generate/verify/expire code| otpStore
    otpAuth -->|dispatch OTP| otpService
    otpService -->|email identifiers| emailService
    otpService -->|phone identifiers| smsService
    otpAuth -->|find-or-create user by identifier| userStore
    otpAuth -->|create/expire session, AC4/AC7/AC10| sessionStore
    otpAuth -->|read sessionToken cookie on logout| cookies
    otpAuth -->|AC1/AC5/edge: malformed input| idPage
    otpAuth -->|AC2/AC6/AC8/AC9/edge: expired,replay| codePage
    otpAuth -->|AC3/AC4/AC7/AC10| accountPage
    requireGameSession -.already reuses.-> sessionStore
    requireGameSession -.already reuses.-> cookies

    classDef touched fill:#f96,color:#000
    class app,otpAuth,identifierValidator,otpStore,otpService,emailService,smsService,userStore,idPage,codePage,accountPage touched
  ```

  `sessionStore.js`, `cookies.js`, and `requireGameSession.js` are shown as existing/untouched
  context: this plan calls `sessionStore.create`/`expire` and `cookies.parseCookies` exactly as
  `requireGameSession.js` already does for `/game`, so a logged-in-via-OTP user's session is
  interchangeable with a logged-in-via-password user's session for any future route gated the
  same way.
