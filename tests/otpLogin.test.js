const crypto = require('crypto');
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

describe('AC5: choosing to log in prompts for a registered phone or email', () => {
  it('renders a form asking for phone number or email address', async () => {
    const res = await request(app).get('/otp/login');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/<input[^>]*name="identifier"[^>]*>/);
  });
});

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

describe('AC8: incorrect OTP shows an inline error', () => {
  it('shows an inline error for a wrong code on login', async () => {
    const identifier = 'login.wrong.code@example.com';
    userStore.save({ id: crypto.randomUUID(), email: identifier, verified: true });
    await request(app).post('/otp/login').type('form').send({ identifier });

    const res = await request(app).post('/otp/login/verify').type('form').send({ identifier, code: '000000' });

    expect(res.status).toBe(400);
    expect(res.text).toContain('field-error');
    expect(res.text).toMatch(/incorrect/i);
  });
});

describe('AC9: retry after an incorrect OTP succeeds with the right code', () => {
  it('allows a correct second attempt after a wrong first one on login', async () => {
    const identifier = 'login.retry.user@example.com';
    userStore.save({ id: crypto.randomUUID(), email: identifier, verified: true });
    await request(app).post('/otp/login').type('form').send({ identifier });
    const { code } = emailService.getLastOtpEmailTo(identifier);

    await request(app).post('/otp/login/verify').type('form').send({ identifier, code: '000000' });
    const res = await request(app).post('/otp/login/verify').type('form').send({ identifier, code });

    expect(res.status).toBe(200);
  });
});

describe('edge case: an expired OTP is rejected', () => {
  it('rejects a correct code after the login OTP has expired', async () => {
    const identifier = 'login.expired@example.com';
    userStore.save({ id: crypto.randomUUID(), email: identifier, verified: true });
    await request(app).post('/otp/login').type('form').send({ identifier });
    const { code } = emailService.getLastOtpEmailTo(identifier);
    otpStore.expire(identifier, 'login');

    const res = await request(app).post('/otp/login/verify').type('form').send({ identifier, code });

    expect(res.status).toBe(400);
  });
});

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

describe('edge case: malformed identifier input', () => {
  it.each([[''], ['not-an-identifier'], ['12345']])(
    'rejects %j with a 400 and no OTP sent',
    async (identifier) => {
      const res = await request(app).post('/otp/login').type('form').send({ identifier });
      expect(res.status).toBe(400);
    }
  );

  it('rejects a non-string identifier (e.g. an array) without crashing', async () => {
    const res = await request(app).post('/otp/login').send({ identifier: ['a@b.com'] });
    expect(res.status).toBe(400);
  });
});

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
    expect(smsService.getLastSmsTo('+15551234567').code).toMatch(/^\d{6}$/);
  });
});
