const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
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
  emailService.reset();
});

describe('AC4: invalid email format', () => {
  it('rejects registration when email format is invalid', async () => {
    const payload = { ...validPayload(), email: 'not-an-email' };

    const res = await request(app).post('/api/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email/i);
  });

  it('rejects registration when email is a non-string value', async () => {
    const payload = { ...validPayload(), email: ['jane.doe@example.com'] };

    const res = await request(app).post('/api/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email/i);
  });
});

describe('MT-STORY-019 AC3: duplicate unverified email', () => {
  it('resends the verification email and does not create a duplicate account', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);
    const firstToken = emailService.getLastEmailTo(payload.email).token;

    const duplicatePayload = {
      ...validPayload(),
      name: 'Someone Else',
      email: 'Jane.Doe@Example.com',
    };
    const res = await request(app).post('/api/register').send(duplicatePayload);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/check your inbox/i);

    const resentEmail = emailService.getLastEmailTo(payload.email);
    expect(resentEmail.to).toBe(payload.email);
    expect(resentEmail.token).not.toBe(firstToken);

    expect(userStore.findByEmail(payload.email)).toBeDefined();
  });
});

describe('MT-STORY-019 AC2: duplicate verified email', () => {
  it('rejects registration and nudges the user to log in or reset their password', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);
    const existing = userStore.findByEmail(payload.email);
    existing.verified = true;
    userStore.save(existing);

    const duplicatePayload = {
      ...validPayload(),
      name: 'Someone Else',
      email: 'Jane.Doe@Example.com',
    };
    const res = await request(app).post('/api/register').send(duplicatePayload);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
    expect(res.body.error).toMatch(/log in|reset your password/i);
  });
});

describe('AC1: successful registration', () => {
  it('creates a new account and returns a confirmation', async () => {
    const payload = validPayload();

    const res = await request(app).post('/api/register').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/registration successful/i);
    expect(res.body.user).toMatchObject({
      name: payload.name,
      email: payload.email,
    });
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('creates the account in an unverified state and dispatches a verification email', async () => {
    const payload = validPayload();

    const res = await request(app).post('/api/register').send(payload);

    expect(res.status).toBe(201);
    const stored = userStore.findByEmail(payload.email);
    expect(stored.verified).toBe(false);

    const sentEmail = emailService.getLastEmailTo(payload.email);
    expect(sentEmail).toBeDefined();
    expect(sentEmail.token).toBeDefined();
  });
});

describe('AC5: password requirements not met', () => {
  it('rejects registration when password is too weak', async () => {
    const payload = { ...validPayload(), password: 'abc' };

    const res = await request(app).post('/api/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password must be at least 8 characters/i);
  });

  it('creates no account and dispatches no email when password is too weak', async () => {
    const payload = { ...validPayload(), password: 'abc' };

    await request(app).post('/api/register').send(payload);

    expect(userStore.findByEmail(payload.email)).toBeUndefined();
    expect(emailService.getLastEmailTo(payload.email)).toBeUndefined();
  });
});

describe('AC3: required field missing', () => {
  const requiredFields = ['name', 'email', 'password', 'dateOfBirth'];

  requiredFields.forEach((field) => {
    it(`rejects registration when ${field} is missing`, async () => {
      const payload = validPayload();
      delete payload[field];

      const res = await request(app).post('/api/register').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(new RegExp(`${field} is required`, 'i'));
    });
  });
});
