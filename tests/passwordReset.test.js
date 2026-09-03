const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const passwordResetTokenStore = require('../src/store/passwordResetTokenStore');
const sessionStore = require('../src/store/sessionStore');
const emailService = require('../src/services/emailService');

const generateValidPassword = () => `Aa1${crypto.randomBytes(6).toString('hex')}`;

async function registerVerifiedUser(email) {
  const password = generateValidPassword();
  await request(app)
    .post('/register')
    .type('form')
    .send({ name: 'Jordan Rivera', email, password });
  const user = userStore.findByEmail(email);
  user.verified = true;
  userStore.save(user);
  return { email, password };
}

beforeEach(() => {
  userStore.reset();
  passwordResetTokenStore.reset();
  sessionStore.reset();
  emailService.reset();
});

describe('AC1: verified user requests a reset link', () => {
  it('links the forgot-password page from the homepage', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('href="/forgot-password"');
  });

  it('sends a reset email and shows a generic confirmation', async () => {
    const { email } = await registerVerifiedUser('verified.ac1@example.com');

    const res = await request(app).post('/forgot-password').type('form').send({ email });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('check your inbox');

    const sentEmail = emailService.getLastEmailTo(email);
    expect(sentEmail).toBeDefined();
    const record = passwordResetTokenStore.findByToken(sentEmail.token);
    expect(record).toBeDefined();
    expect(record.email).toBe(email.toLowerCase());
  });
});

describe('AC2: unregistered or unverified email does not leak account existence', () => {
  it('shows the same generic confirmation for an unregistered email and sends no email', async () => {
    const verifiedRes = await (async () => {
      const { email } = await registerVerifiedUser('verified.ac2@example.com');
      return request(app).post('/forgot-password').type('form').send({ email });
    })();

    const unknownRes = await request(app)
      .post('/forgot-password')
      .type('form')
      .send({ email: 'nobody.ac2@example.com' });

    expect(unknownRes.status).toBe(200);
    expect(unknownRes.text).toBe(verifiedRes.text);
    expect(emailService.getLastEmailTo('nobody.ac2@example.com')).toBeUndefined();
  });

  it('shows the same generic confirmation for a registered-but-unverified email and sends no email', async () => {
    const password = generateValidPassword();
    const email = 'unverified.ac2@example.com';
    await request(app).post('/register').type('form').send({ name: 'Sam Lee', email, password });

    const res = await request(app).post('/forgot-password').type('form').send({ email });

    expect(res.status).toBe(200);
    expect(res.text).toContain('check your inbox');
    expect(emailService.getLastEmailTo(email)).toBeUndefined();
  });

  it('does not crash on a missing email field', async () => {
    const res = await request(app).post('/forgot-password').type('form').send({});

    expect(res.status).toBe(200);
    expect(res.text).toContain('check your inbox');
  });

  it('does not crash on a non-string email field', async () => {
    const res = await request(app)
      .post('/forgot-password')
      .send({ email: {} });

    expect(res.status).toBe(200);
    expect(res.text).toContain('check your inbox');
  });
});

describe('AC3: a second reset request invalidates the first', () => {
  it('invalidates the earlier link once a new one is requested', async () => {
    const { email } = await registerVerifiedUser('verified.ac3@example.com');

    await request(app).post('/forgot-password').type('form').send({ email });
    const tokenA = emailService.getLastEmailTo(email).token;

    await request(app).post('/forgot-password').type('form').send({ email });
    const tokenB = emailService.getLastEmailTo(email).token;

    expect(tokenA).not.toBe(tokenB);

    const oldRes = await request(app).get('/reset-password').query({ token: tokenA });
    expect(oldRes.status).toBe(410);
    expect(oldRes.text).toMatch(/no longer valid|already been used/i);

    const newRes = await request(app).get('/reset-password').query({ token: tokenB });
    expect(newRes.status).toBe(200);
    expect(newRes.text).toMatch(/<input[^>]*type="hidden"[^>]*name="token"[^>]*value="([^"]*)"/);
    expect(newRes.text).toMatch(/<input[^>]*type="password"[^>]*name="password"[^>]*>/);
  });
});

describe('AC4: submitting a qualifying new password via a valid link', () => {
  it('updates the password, invalidates the link, and offers to log in', async () => {
    const { email, password: oldPassword } = await registerVerifiedUser('verified.ac4@example.com');

    await request(app).post('/forgot-password').type('form').send({ email });
    const token = emailService.getLastEmailTo(email).token;

    const formRes = await request(app).get('/reset-password').query({ token });
    expect(formRes.status).toBe(200);

    const newPassword = generateValidPassword();
    const resetRes = await request(app)
      .post('/reset-password')
      .type('form')
      .send({ token, password: newPassword });

    expect(resetRes.status).toBe(200);
    expect(resetRes.text).toContain('Continue to Log In');
    expect(resetRes.text).toContain('href="/"');

    const oldLoginRes = await request(app)
      .post('/login')
      .type('form')
      .send({ email, password: oldPassword });
    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request(app)
      .post('/login')
      .type('form')
      .send({ email, password: newPassword });
    expect(newLoginRes.status).toBe(200);

    const reuseRes = await request(app).get('/reset-password').query({ token });
    expect(reuseRes.status).toBe(410);
    expect(reuseRes.text).toMatch(/no longer valid|already been used/i);
  });

  it('rejects a weak new password and redisplays the form', async () => {
    const { email } = await registerVerifiedUser('verified.ac4b@example.com');

    await request(app).post('/forgot-password').type('form').send({ email });
    const token = emailService.getLastEmailTo(email).token;

    const res = await request(app)
      .post('/reset-password')
      .type('form')
      .send({ token, password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.text).toMatch(/password must be at least 8 characters/i);
  });
});

describe('AC5: a link older than 1 hour is rejected with an expiry message', () => {
  it('rejects an expired link on GET and offers a new link', async () => {
    const { email } = await registerVerifiedUser('verified.ac5@example.com');

    await request(app).post('/forgot-password').type('form').send({ email });
    const token = emailService.getLastEmailTo(email).token;
    passwordResetTokenStore.expire(token);

    const res = await request(app).get('/reset-password').query({ token });

    expect(res.status).toBe(410);
    expect(res.text).toMatch(/expired/i);
    expect(res.text).toContain('href="/forgot-password"');
  });

  it('independently rejects an expired link on POST', async () => {
    const { email } = await registerVerifiedUser('verified.ac5b@example.com');

    await request(app).post('/forgot-password').type('form').send({ email });
    const token = emailService.getLastEmailTo(email).token;
    passwordResetTokenStore.expire(token);

    const res = await request(app)
      .post('/reset-password')
      .type('form')
      .send({ token, password: generateValidPassword() });

    expect(res.status).toBe(410);
    expect(res.text).toMatch(/expired/i);
  });
});

describe('AC6: an already-used link is rejected and reported as no longer valid', () => {
  it('rejects a link already consumed by a completed reset, with wording distinct from expiry', async () => {
    const { email } = await registerVerifiedUser('verified.ac6@example.com');

    await request(app).post('/forgot-password').type('form').send({ email });
    const token = emailService.getLastEmailTo(email).token;
    await request(app)
      .post('/reset-password')
      .type('form')
      .send({ token, password: generateValidPassword() });

    const res = await request(app).get('/reset-password').query({ token });

    expect(res.status).toBe(410);
    expect(res.text).toMatch(/already been used|no longer valid/i);
    expect(res.text).not.toMatch(/expired/i);
  });
});
