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

describe('edge case: logout with no active session', () => {
  it('redirects home without a sessionToken cookie', async () => {
    const res = await request(app).post('/otp/logout');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });
});
