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

describe('MT-STORY-019 AC4: login denied before email verification', () => {
  it('denies access and prompts the user to check their inbox', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);
    const { email, password } = payload;

    const res = await request(app).post('/api/login').send({ email, password });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/verify your email|check your inbox/i);
  });
});

describe('MT-STORY-019 AC6: login succeeds once the account is verified', () => {
  it('grants access after the verification link has been clicked', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);
    const { email, password } = payload;
    const { token } = emailService.getLastEmailTo(email);
    await request(app).get('/api/verify-email').query({ token });

    const res = await request(app).post('/api/login').send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/login successful/i);
  });
});

describe('security: login does not leak account existence via response timing', () => {
  it('performs the same expensive password comparison for an unregistered email', async () => {
    const scryptSpy = jest.spyOn(crypto, 'scryptSync');
    const email = 'nobody@example.com';
    const pwd = generateValidPassword();

    const res = await request(app).post('/api/login').send({ email, password: pwd });

    expect(res.status).toBe(401);
    expect(scryptSpy).toHaveBeenCalled();

    scryptSpy.mockRestore();
  });
});
