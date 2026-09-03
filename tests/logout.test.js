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

function extractSessionToken(res) {
  const setCookie = res.headers['set-cookie'] || [];
  const cookieLine = setCookie.find((line) => line.startsWith('sessionToken='));
  const match = cookieLine && cookieLine.match(/sessionToken=([^;]+)/);
  return match ? match[1] : undefined;
}

async function registerAndLogin(agent, overrides = {}) {
  const payload = registrationPayload(overrides);
  await agent.post('/register').type('form').send(payload);
  const loginRes = await agent
    .post('/login')
    .type('form')
    .send({ email: payload.email, password: payload.password });
  return { payload, loginRes };
}

beforeEach(() => {
  userStore.reset();
  sessionStore.reset();
  emailService.reset();
});

describe('AC1: logout invalidates the server-side session', () => {
  it('expires the session server-side so it is no longer active', async () => {
    const agent = request.agent(app);
    const { loginRes } = await registerAndLogin(agent);
    const token = extractSessionToken(loginRes);
    expect(token).toBeDefined();

    await agent.post('/logout');

    expect(sessionStore.isActive(token)).toBe(false);
  });

  it('clears the sessionToken cookie', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const res = await agent.post('/logout');

    const setCookie = res.headers['set-cookie'] || [];
    const cleared = setCookie.find((line) => line.startsWith('sessionToken='));
    expect(cleared).toBeDefined();
    expect(cleared).toMatch(/sessionToken=;/);
  });
});

describe('AC2: logout redirects to the login/landing page', () => {
  it('redirects to the home/login landing page', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const res = await agent.post('/logout');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });
});

describe('AC3: a logged-out user hitting a protected page is redirected without its content', () => {
  it('redirects a logged-out user away from the protected game page without its content', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const beforeLogout = await agent.get('/game');
    expect(beforeLogout.status).toBe(200);
    expect(beforeLogout.text).toContain('id="slot-machine"');

    await agent.post('/logout');
    const res = await agent.get('/game');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
    expect(res.text).not.toContain('id="slot-machine"');
  });
});

describe('AC4: back button to a protected page after logout is also blocked', () => {
  it('marks the protected game page as not cacheable so a back-navigation must revalidate', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const res = await agent.get('/game');

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toMatch(/no-store/);
  });

  it('redirects on the revalidation request a back-button navigation would trigger post-logout', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);
    await agent.get('/game');

    await agent.post('/logout');
    const res = await agent.get('/game');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
    expect(res.text).not.toContain('id="slot-machine"');
  });
});
