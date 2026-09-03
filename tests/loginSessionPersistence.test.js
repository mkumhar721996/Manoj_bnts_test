const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const sessionStore = require('../src/store/sessionStore');
const emailService = require('../src/services/emailService');

const generateValidPassword = () => `longenough${crypto.randomBytes(4).toString('hex')}`;

function registrationPayload(overrides = {}) {
  return {
    name: 'Jordan Rivera',
    email: `jordan-${crypto.randomBytes(4).toString('hex')}@example.com`,
    password: generateValidPassword(),
    ...overrides,
  };
}

function extractSetCookieLine(res) {
  const setCookie = res.headers['set-cookie'] || [];
  return setCookie.find((line) => line.startsWith('sessionToken='));
}

async function register(agent, overrides = {}) {
  const payload = registrationPayload(overrides);
  await agent.post('/register').type('form').send(payload);
  return payload;
}

beforeEach(() => {
  userStore.reset();
  sessionStore.reset();
  emailService.reset();
});

describe('AC1: valid login redirects to the default dashboard (/feed)', () => {
  it('renders a login page with email, password, and remember-me fields', async () => {
    const res = await request(app).get('/login');

    expect(res.status).toBe(200);
    expect(res.text).toContain('action="/login"');
    expect(res.text).toMatch(/<input[^>]*name="email"[^>]*>/);
    expect(res.text).toMatch(/<input[^>]*type="password"[^>]*name="password"[^>]*>/);
    expect(res.text).toMatch(/<input[^>]*type="checkbox"[^>]*name="rememberMe"[^>]*>/);
  });

  it('redirects to /feed on valid credentials, and /feed renders the dashboard', async () => {
    const agent = request.agent(app);
    const payload = await register(agent);

    const res = await agent
      .post('/login')
      .type('form')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/feed');

    const feedRes = await agent.get('/feed');

    expect(feedRes.status).toBe(200);
    expect(feedRes.text).toContain('class="app-shell"');
    expect(feedRes.text).toContain('Welcome back, Jordan!');
  });
});

describe('AC5: unauthenticated access to a protected page redirects to login, then back', () => {
  it('redirects GET /feed to /login with a redirectTo query param', async () => {
    const res = await request(app).get('/feed');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login?redirectTo=%2Ffeed');
  });

  it('carries redirectTo through the login page into a hidden field', async () => {
    const res = await request(app).get('/login?redirectTo=%2Ffeed');

    expect(res.status).toBe(200);
    expect(res.text).toContain('name="redirectTo" value="/feed"');
  });

  it('returns the user to the originally requested page after logging in', async () => {
    const agent = request.agent(app);
    const payload = await register(agent);

    const res = await agent
      .post('/login')
      .type('form')
      .send({ email: payload.email, password: payload.password, redirectTo: '/feed' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/feed');

    const feedRes = await agent.get('/feed');
    expect(feedRes.status).toBe(200);
    expect(feedRes.text).toContain('class="app-shell"');
  });
});

describe('security: redirectTo cannot be used for an open redirect', () => {
  it('ignores an absolute-URL redirectTo and falls back to /feed', async () => {
    const agent = request.agent(app);
    const payload = await register(agent);

    const res = await agent
      .post('/login')
      .type('form')
      .send({
        email: payload.email,
        password: payload.password,
        redirectTo: 'https://evil.example.com',
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/feed');
  });

  it('ignores a protocol-relative redirectTo and falls back to /feed', async () => {
    const agent = request.agent(app);
    const payload = await register(agent);

    const res = await agent
      .post('/login')
      .type('form')
      .send({
        email: payload.email,
        password: payload.password,
        redirectTo: '//evil.example.com',
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/feed');
  });
});

describe('security: session cookie is protected against cross-site requests', () => {
  it('sets SameSite=Lax on the session cookie regardless of remember-me', async () => {
    const agent = request.agent(app);
    const payload = await register(agent);

    const res = await agent
      .post('/login')
      .type('form')
      .send({ email: payload.email, password: payload.password });

    const cookieLine = extractSetCookieLine(res);
    expect(cookieLine).toMatch(/SameSite=Lax/i);
  });

  it('sets SameSite=Lax on the session cookie when remember-me is checked', async () => {
    const agent = request.agent(app);
    const payload = await register(agent);

    const res = await agent
      .post('/login')
      .type('form')
      .send({ email: payload.email, password: payload.password, rememberMe: 'on' });

    const cookieLine = extractSetCookieLine(res);
    expect(cookieLine).toMatch(/SameSite=Lax/i);
  });
});

describe('AC4: wrong email or password shows one generic error, without authenticating', () => {
  it('returns the same status and message for a wrong password as for an unregistered email', async () => {
    const payload = await register(request.agent(app));

    const wrongPasswordRes = await request(app)
      .post('/login')
      .type('form')
      .send({ email: payload.email, password: generateValidPassword() });

    const unregisteredRes = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'nobody@example.com', password: generateValidPassword() });

    expect(wrongPasswordRes.status).toBe(401);
    expect(unregisteredRes.status).toBe(401);
    expect(wrongPasswordRes.text).toContain(
      'The email or password you entered is incorrect. Access denied.'
    );
    expect(unregisteredRes.text).toContain(
      'The email or password you entered is incorrect. Access denied.'
    );
    expect(extractSetCookieLine(wrongPasswordRes)).toBeUndefined();
    expect(extractSetCookieLine(unregisteredRes)).toBeUndefined();
  });

  it('never authenticates the agent after a failed login attempt', async () => {
    const agent = request.agent(app);
    await register(agent, { email: 'still-anon@example.com' });

    await agent
      .post('/login')
      .type('form')
      .send({ email: 'still-anon@example.com', password: generateValidPassword() });

    const feedRes = await agent.get('/feed');
    expect(feedRes.status).toBe(302);
    expect(feedRes.headers.location).toBe('/login?redirectTo=%2Ffeed');
  });
});

describe('AC3: without remember me, the session is a browser-session cookie with a short absolute cap', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sets a session cookie with no Max-Age/Expires when rememberMe is not checked', async () => {
    const agent = request.agent(app);
    const payload = await register(agent);

    const res = await agent
      .post('/login')
      .type('form')
      .send({ email: payload.email, password: payload.password });

    const cookieLine = extractSetCookieLine(res);
    expect(cookieLine).toBeDefined();
    expect(cookieLine).not.toMatch(/Max-Age/i);
    expect(cookieLine).not.toMatch(/Expires/i);
  });

  it('expires the session after the default TTL with no remember-me', async () => {
    const agent = request.agent(app);
    const payload = await register(agent);
    const start = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => start);

    await agent
      .post('/login')
      .type('form')
      .send({ email: payload.email, password: payload.password });

    jest.spyOn(Date, 'now').mockImplementation(() => start + 4 * 60 * 60 * 1000 + 1000);

    const feedRes = await agent.get('/feed');
    expect(feedRes.status).toBe(302);
    expect(feedRes.headers.location).toBe('/login?redirectTo=%2Ffeed');
  });
});

describe('AC2: with remember me, the session persists 30 days across restarts', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sets a 30-day Max-Age cookie when rememberMe is checked', async () => {
    const agent = request.agent(app);
    const payload = await register(agent);

    const res = await agent
      .post('/login')
      .type('form')
      .send({ email: payload.email, password: payload.password, rememberMe: 'on' });

    const cookieLine = extractSetCookieLine(res);
    expect(cookieLine).toBeDefined();
    expect(cookieLine).toMatch(/Max-Age=2592000/);
  });

  it('keeps the session valid after 29 days, but not after 31 days', async () => {
    const agent = request.agent(app);
    const payload = await register(agent);
    const start = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => start);

    await agent
      .post('/login')
      .type('form')
      .send({ email: payload.email, password: payload.password, rememberMe: 'on' });

    jest.spyOn(Date, 'now').mockImplementation(() => start + 29 * 24 * 60 * 60 * 1000);
    const stillValidRes = await agent.get('/feed');
    expect(stillValidRes.status).toBe(200);

    jest.spyOn(Date, 'now').mockImplementation(() => start + 31 * 24 * 60 * 60 * 1000);
    const expiredRes = await agent.get('/feed');
    expect(expiredRes.status).toBe(302);
    expect(expiredRes.headers.location).toBe('/login?redirectTo=%2Ffeed');
  });
});
