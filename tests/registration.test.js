const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');

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
});

describe('AC4: invalid email format', () => {
  it('rejects registration when email format is invalid', async () => {
    const payload = { ...validPayload(), email: 'not-an-email' };

    const res = await request(app).post('/api/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email/i);
  });
});

describe('AC2: duplicate email rejected', () => {
  it('rejects registration when the email is already in use', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);

    const duplicatePayload = {
      ...validPayload(),
      name: 'Someone Else',
      email: 'Jane.Doe@Example.com',
    };
    const res = await request(app).post('/api/register').send(duplicatePayload);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email is already in use/i);
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
});

describe('AC5: password requirements not met', () => {
  it('rejects registration when password is too weak', async () => {
    const payload = { ...validPayload(), password: 'abc' };

    const res = await request(app).post('/api/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password must be at least 8 characters/i);
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
