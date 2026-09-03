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

describe('AC1: no session token redirects to the homepage', () => {
  it('redirects GET /game to / without rendering the game page', async () => {
    const res = await request(app).get('/game');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
    expect(res.text).not.toContain('id="slot-machine"');
  });
});

describe('AC2: valid, active session serves the game page without a credential prompt', () => {
  it('serves the slot-machine page after logging in', async () => {
    const agent = request.agent(app);
    const { loginRes } = await registerAndLogin(agent);
    expect(loginRes.status).toBe(302);

    const res = await agent.get('/game');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('id="slot-machine"');
    expect(res.text).not.toContain('action="/login"');
  });
});

describe('AC6: a server restart wiping sessions fails closed', () => {
  it('redirects to / when the in-memory session store has been reset', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const okRes = await agent.get('/game');
    expect(okRes.status).toBe(200);

    sessionStore.reset();

    const res = await agent.get('/game');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });
});

describe('AC3: an expired session token redirects to the homepage', () => {
  it('redirects to / once the session token has expired', async () => {
    const agent = request.agent(app);
    const { loginRes } = await registerAndLogin(agent);
    const token = extractSessionToken(loginRes);
    expect(token).toBeDefined();

    sessionStore.expire(token);

    const res = await agent.get('/game');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });
});

describe('AC4/AC5/AC8: idle timeout on the game route', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AC4: redirects to / after being idle on /game for more than 10 minutes', async () => {
    const agent = request.agent(app);
    const start = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => start);
    await registerAndLogin(agent);

    jest.spyOn(Date, 'now').mockImplementation(() => start + 10 * 60 * 1000 + 1000);

    const res = await agent.get('/game');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  it('AC8: serves the game page when idle for exactly 9 minutes 59 seconds', async () => {
    const agent = request.agent(app);
    const start = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => start);
    await registerAndLogin(agent);

    jest.spyOn(Date, 'now').mockImplementation(() => start + 9 * 60 * 1000 + 59 * 1000);

    const res = await agent.get('/game');

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="slot-machine"');
  });

  it('AC5: a request to /game resets the idle window so a later request within 10 minutes of it still succeeds', async () => {
    const agent = request.agent(app);
    const start = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => start);
    await registerAndLogin(agent);

    jest.spyOn(Date, 'now').mockImplementation(() => start + 9 * 60 * 1000);
    const midRes = await agent.get('/game');
    expect(midRes.status).toBe(200);

    jest.spyOn(Date, 'now').mockImplementation(
      () => start + 9 * 60 * 1000 + 9 * 60 * 1000 + 59 * 1000
    );
    const res = await agent.get('/game');

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="slot-machine"');
  });
});

describe('AC7: an unverified email does not block access to /game', () => {
  it('serves the game page even though the newly registered user is unverified', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    expect(userStore.findByEmail(payload.email).verified).toBe(false);

    const res = await agent.get('/game');

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="slot-machine"');
  });
});
