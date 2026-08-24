const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const verificationTokenStore = require('../src/store/verificationTokenStore');
const sessionStore = require('../src/store/sessionStore');
const emailService = require('../src/services/emailService');

const generateValidPassword = () => `Aa1${crypto.randomBytes(6).toString('hex')}`;

const validPayload = () => {
  const pwd = generateValidPassword();
  return {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    password: pwd,
    dateOfBirth: '1990-01-01',
  };
};

beforeEach(() => {
  userStore.reset();
  verificationTokenStore.reset();
  sessionStore.reset();
  emailService.reset();
});

describe('AC2: unverified user is blocked from authenticated access', () => {
  it('blocks an unverified user from accessing a protected route', async () => {
    const registerRes = await request(app).post('/api/register').send(validPayload());
    const { sessionToken } = registerRes.body;

    const res = await request(app)
      .get('/api/account')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/verify.*email/i);
  });

  it('rejects access with no Authorization header', async () => {
    const res = await request(app).get('/api/account');

    expect(res.status).toBe(401);
  });

  it('rejects access when the bearer token is unknown', async () => {
    const res = await request(app)
      .get('/api/account')
      .set('Authorization', `Bearer ${crypto.randomUUID()}`);

    expect(res.status).toBe(401);
  });

  it('rejects access when the Authorization header is malformed (no Bearer prefix)', async () => {
    const registerRes = await request(app).post('/api/register').send(validPayload());

    const res = await request(app)
      .get('/api/account')
      .set('Authorization', registerRes.body.sessionToken);

    expect(res.status).toBe(401);
  });

  it('rejects access when the Authorization header is sent as a repeated header', async () => {
    const res = await request(app)
      .get('/api/account')
      .set('Authorization', ['Bearer aaa', 'Bearer bbb']);

    expect(res.status).toBe(401);
  });

  it('does not grant access by sending a real user id as a bearer token (spoofing regression)', async () => {
    const registerRes = await request(app).post('/api/register').send(validPayload());
    const { id: userId, verified } = registerRes.body.user;
    expect(verified).toBe(false);

    const res = await request(app)
      .get('/api/account')
      .set('Authorization', `Bearer ${userId}`);

    expect(res.status).toBe(401);
  });

  it('does not allow a client to self-verify at registration via mass assignment', async () => {
    const payload = { ...validPayload(), verified: true };

    const res = await request(app).post('/api/register').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.user.verified).toBe(false);
  });
});

describe('AC1: clicking a valid confirmation link verifies the account and grants access', () => {
  it('marks the account verified and grants access to a protected route', async () => {
    const payload = validPayload();
    const registerRes = await request(app).post('/api/register').send(payload);
    const { sessionToken } = registerRes.body;
    const { token } = emailService.getLastEmailTo(payload.email);

    const verifyRes = await request(app).get('/api/verify-email').query({ token });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.message).toMatch(/verified/i);

    const accountRes = await request(app)
      .get('/api/account')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(accountRes.status).toBe(200);
    expect(accountRes.body).toMatchObject({ verified: true });
  });

  it('never includes a verification token in the registration response body', async () => {
    const payload = validPayload();

    const res = await request(app).post('/api/register').send(payload);

    expect(res.body.token).toBeUndefined();
    expect(res.body.verificationToken).toBeUndefined();
    expect(res.body.user.token).toBeUndefined();
  });

  it('issues a distinct session token per registration, unrelated to the user id', async () => {
    const payloadOne = validPayload();
    const payloadTwo = { ...validPayload(), email: 'session.check@example.com' };

    const resOne = await request(app).post('/api/register').send(payloadOne);
    const resTwo = await request(app).post('/api/register').send(payloadTwo);

    expect(resOne.body.sessionToken).toBeDefined();
    expect(resOne.body.sessionToken).not.toBe(resOne.body.user.id);
    expect(resOne.body.sessionToken).not.toBe(resTwo.body.sessionToken);
  });

  it('generates a unique token per registration', async () => {
    const payloadOne = validPayload();
    const payloadTwo = { ...validPayload(), email: 'other.user@example.com' };

    await request(app).post('/api/register').send(payloadOne);
    await request(app).post('/api/register').send(payloadTwo);

    const tokenOne = emailService.getLastEmailTo(payloadOne.email).token;
    const tokenTwo = emailService.getLastEmailTo(payloadTwo.email).token;

    expect(tokenOne).not.toBe(tokenTwo);
  });
});

describe('AC3: an already-used verification link', () => {
  it('rejects a link that has already been used with a 410 and a login/resend hint', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);
    const { token } = emailService.getLastEmailTo(payload.email);
    await request(app).get('/api/verify-email').query({ token });

    const res = await request(app).get('/api/verify-email').query({ token });

    expect(res.status).toBe(410);
    expect(res.body.error).toMatch(/already been used/i);
    expect(res.body.error).toMatch(/log in|new (verification )?link/i);
  });

  it('rejects a request with no token query param', async () => {
    const res = await request(app).get('/api/verify-email');

    expect(res.status).toBe(400);
  });

  it('rejects a repeated token query param safely', async () => {
    const res = await request(app).get('/api/verify-email?token=a&token=b');

    expect(res.status).toBe(400);
  });

  it('rejects a syntactically plausible but never-issued token distinctly', async () => {
    const res = await request(app)
      .get('/api/verify-email')
      .query({ token: crypto.randomUUID() });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid verification link/i);
  });

  it('prioritizes the "already used" response for a token that is both used and expired', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);
    const { token } = emailService.getLastEmailTo(payload.email);
    await request(app).get('/api/verify-email').query({ token });
    verificationTokenStore.expire(token);

    const res = await request(app).get('/api/verify-email').query({ token });

    expect(res.status).toBe(410);
    expect(res.body.error).toMatch(/already been used/i);
  });

  it('allows re-verifying an already-verified account via a second still-valid token', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);
    const firstToken = emailService.getLastEmailTo(payload.email).token;
    await request(app).get('/api/verify-email').query({ token: firstToken });

    const secondToken = verificationTokenStore.create(payload.email);
    const res = await request(app).get('/api/verify-email').query({ token: secondToken });

    expect(res.status).toBe(200);
  });
});

describe('AC4: an expired verification link', () => {
  it('rejects an expired link with a 410 and a resend hint', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);
    const { token } = emailService.getLastEmailTo(payload.email);
    verificationTokenStore.expire(token);

    const res = await request(app).get('/api/verify-email').query({ token });

    expect(res.status).toBe(410);
    expect(res.body.error).toMatch(/expired/i);
    expect(res.body.error).toMatch(/resend|new (verification )?link/i);
  });

  it('resends a verification email with a new working token', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);
    const oldToken = emailService.getLastEmailTo(payload.email).token;
    verificationTokenStore.expire(oldToken);

    const resendRes = await request(app)
      .post('/api/resend-verification')
      .send({ email: payload.email });

    expect(resendRes.status).toBe(200);

    const newToken = emailService.getLastEmailTo(payload.email).token;
    expect(newToken).not.toBe(oldToken);

    const verifyRes = await request(app).get('/api/verify-email').query({ token: newToken });
    expect(verifyRes.status).toBe(200);
  });

  it('returns a generic 200 when resending for an unknown email (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/resend-verification')
      .send({ email: 'unknown@example.com' });

    expect(res.status).toBe(200);
    expect(emailService.getLastEmailTo('unknown@example.com')).toBeUndefined();
  });

  it('returns 400 when resending with a missing email field', async () => {
    const res = await request(app).post('/api/resend-verification').send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 when resending with a non-string email', async () => {
    const res = await request(app)
      .post('/api/resend-verification')
      .send({ email: ['a@example.com'] });

    expect(res.status).toBe(400);
  });

  it('resends using a differently-cased email and still finds the account', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);

    const res = await request(app)
      .post('/api/resend-verification')
      .send({ email: payload.email.toUpperCase() });

    expect(res.status).toBe(200);
  });

  it('returns a generic 200 for an already-verified account without emailing again (no enumeration)', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);
    const { token } = emailService.getLastEmailTo(payload.email);
    await request(app).get('/api/verify-email').query({ token });

    const beforeToken = emailService.getLastEmailTo(payload.email).token;
    const res = await request(app)
      .post('/api/resend-verification')
      .send({ email: payload.email });

    expect(res.status).toBe(200);
    expect(emailService.getLastEmailTo(payload.email).token).toBe(beforeToken);
  });

  it('returns the same generic message for unknown, already-verified, and unverified emails', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);

    const unknownRes = await request(app)
      .post('/api/resend-verification')
      .send({ email: 'nobody@example.com' });
    const unverifiedRes = await request(app)
      .post('/api/resend-verification')
      .send({ email: payload.email });

    expect(unknownRes.body.message).toBe(unverifiedRes.body.message);
  });
});
