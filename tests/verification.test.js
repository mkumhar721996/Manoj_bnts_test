const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const mailer = require('../src/services/mailer');

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
  mailer.reset();
});

describe('MT-STORY-019 AC6: verifying an account via the emailed link', () => {
  it('marks the account as verified when the token is valid', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);
    const token = mailer.getSentEmails()[0].token;

    const res = await request(app).get(`/api/verify/${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verified/i);
    expect(userStore.findByEmail(payload.email).verified).toBe(true);
  });

  it('rejects an invalid or expired token without mutating any account', async () => {
    const payload = validPayload();
    await request(app).post('/api/register').send(payload);

    const res = await request(app).get('/api/verify/not-a-real-token');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or expired/i);
    expect(userStore.findByEmail(payload.email).verified).toBe(false);
  });
});
