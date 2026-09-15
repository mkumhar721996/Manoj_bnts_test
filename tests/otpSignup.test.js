const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const otpStore = require('../src/store/otpStore');
const sessionStore = require('../src/store/sessionStore');
const emailService = require('../src/services/emailService');
const smsService = require('../src/services/smsService');

beforeEach(() => {
  userStore.reset();
  otpStore.reset();
  sessionStore.reset();
  emailService.reset();
  smsService.reset();
});

describe('AC1: choosing to sign up prompts for phone or email', () => {
  it('renders a form asking for phone number or email address', async () => {
    const res = await request(app).get('/otp/signup');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/<input[^>]*name="identifier"[^>]*>/);
    expect(res.text).toContain('Phone number or email address');
  });
});

describe('AC2: valid sign-up details trigger an OTP', () => {
  it('emails a 6-digit OTP for a valid email identifier', async () => {
    const res = await request(app)
      .post('/otp/signup')
      .type('form')
      .send({ identifier: 'new.user@example.com' });
    expect(res.status).toBe(200);
    const sent = emailService.getLastOtpEmailTo('new.user@example.com');
    expect(sent.code).toMatch(/^\d{6}$/);
  });

  it('texts a 6-digit OTP for a valid phone identifier', async () => {
    await request(app).post('/otp/signup').type('form').send({ identifier: '+15551234567' });
    expect(smsService.getLastSmsTo('+15551234567').code).toMatch(/^\d{6}$/);
  });
});

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

describe('AC4: correct OTP logs the user in', () => {
  it('sets a sessionToken cookie after account creation', async () => {
    const identifier = 'login.after.signup@example.com';
    await request(app).post('/otp/signup').type('form').send({ identifier });
    const { code } = emailService.getLastOtpEmailTo(identifier);

    const res = await request(app).post('/otp/signup/verify').type('form').send({ identifier, code });

    expect(res.headers['set-cookie'].some((c) => c.startsWith('sessionToken='))).toBe(true);
  });
});

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

describe('edge case: malformed identifier input', () => {
  it.each([[''], ['not-an-identifier'], ['12345']])(
    'rejects %j with a 400 and no OTP sent',
    async (identifier) => {
      const res = await request(app).post('/otp/signup').type('form').send({ identifier });
      expect(res.status).toBe(400);
      expect(res.text).toMatch(/valid phone number or email|phone number or email address/i);
    }
  );

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

describe('security: brute-force lockout on repeated incorrect OTP attempts', () => {
  it('returns 429 after too many incorrect signup verification attempts', async () => {
    const identifier = 'lockout.signup@example.com';
    await request(app).post('/otp/signup').type('form').send({ identifier });

    let res;
    for (let i = 0; i < 5; i += 1) {
      res = await request(app).post('/otp/signup/verify').type('form').send({ identifier, code: '000000' });
    }

    expect(res.status).toBe(429);
    expect(userStore.findByIdentifier(identifier)).toBeUndefined();
  });
});

describe('edge case: duplicate sign-up reuses the existing account', () => {
  it('does not create a second user record for an already-registered identifier', async () => {
    const identifier = 'existing.signup@example.com';
    const crypto = require('crypto');
    const existing = { id: crypto.randomUUID(), email: identifier, verified: true };
    userStore.save(existing);

    await request(app).post('/otp/signup').type('form').send({ identifier });
    const { code } = emailService.getLastOtpEmailTo(identifier);
    const res = await request(app).post('/otp/signup/verify').type('form').send({ identifier, code });

    expect(res.status).toBe(201);
    expect(userStore.findByIdentifier(identifier).id).toBe(existing.id);
  });
});
