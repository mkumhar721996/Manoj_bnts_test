const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const sessionStore = require('../src/store/sessionStore');
const emailService = require('../src/services/emailService');
const addressStore = require('../src/store/addressStore');

const generateValidPassword = () => `longenough${crypto.randomBytes(4).toString('hex')}`;

function registrationPayload(overrides = {}) {
  return {
    name: 'Jordan Rivera',
    email: `jordan-${crypto.randomBytes(4).toString('hex')}@example.com`,
    password: generateValidPassword(),
    ...overrides,
  };
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

function seedAddress(userId, overrides = {}) {
  const address = {
    id: crypto.randomUUID(),
    userId,
    streetAddress: '123 Main St',
    aptSuite: '',
    deliveryInstructions: '',
    ...overrides,
  };
  addressStore.save(address);
  return address;
}

beforeEach(() => {
  userStore.reset();
  sessionStore.reset();
  emailService.reset();
  addressStore.reset();
});

describe('AC1: all saved addresses are listed on page load', () => {
  it('lists every address saved for the logged-in user', async () => {
    const agent = request.agent(app);
    const { loginRes } = await registerAndLogin(agent);
    const userId = sessionStore.findUserId(
      loginRes.headers['set-cookie'][0].match(/sessionToken=([^;]+)/)[1]
    );
    seedAddress(userId, { streetAddress: '123 Main St' });
    seedAddress(userId, { streetAddress: '456 Oak Ave' });

    const res = await agent.get('/addresses');

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="address-list"');
    expect(res.text).toContain('123 Main St');
    expect(res.text).toContain('456 Oak Ave');
  });
});

describe('AC2: selecting delete shows a confirmation prompt before removal', () => {
  it('renders confirm/cancel controls without deleting anything', async () => {
    const agent = request.agent(app);
    const { loginRes } = await registerAndLogin(agent);
    const userId = sessionStore.findUserId(
      loginRes.headers['set-cookie'][0].match(/sessionToken=([^;]+)/)[1]
    );
    const address = seedAddress(userId);

    const res = await agent.get(`/addresses/${address.id}/delete-confirm`);

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/id="confirm-delete-action"/);
    expect(res.text).toMatch(new RegExp(`action="/addresses/${address.id}/delete"`));
    expect(res.text).toMatch(/id="cancel-delete-action"/);

    const listRes = await agent.get('/addresses');
    expect(listRes.text).toContain('123 Main St');
  });
});

describe('AC3: confirming removes the address from the list', () => {
  it('deletes the address when the confirm form is posted', async () => {
    const agent = request.agent(app);
    const { loginRes } = await registerAndLogin(agent);
    const userId = sessionStore.findUserId(
      loginRes.headers['set-cookie'][0].match(/sessionToken=([^;]+)/)[1]
    );
    const address = seedAddress(userId);

    const res = await agent.post(`/addresses/${address.id}/delete`);

    expect(res.status).toBe(200);
    expect(res.text).not.toContain('123 Main St');
  });
});

describe('AC4: cancelling the delete confirmation leaves the address in the list', () => {
  it('does not remove the address when delete-confirm is merely viewed', async () => {
    const agent = request.agent(app);
    const { loginRes } = await registerAndLogin(agent);
    const userId = sessionStore.findUserId(
      loginRes.headers['set-cookie'][0].match(/sessionToken=([^;]+)/)[1]
    );
    const address = seedAddress(userId);

    await agent.get(`/addresses/${address.id}/delete-confirm`);
    const listRes = await agent.get('/addresses');

    expect(listRes.text).toContain('123 Main St');
    expect(listRes.text).toContain(`id="delete-address-${address.id}"`);
  });
});

describe('AC5: empty-state message when there are no saved addresses', () => {
  it('shows the empty state and no address list', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const res = await agent.get('/addresses');

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="empty-addresses"');
    expect(res.text).not.toContain('id="address-list"');
  });
});

describe('AC6: deleting the only address shows the empty-state message', () => {
  it('shows the empty state after deleting the last address', async () => {
    const agent = request.agent(app);
    const { loginRes } = await registerAndLogin(agent);
    const userId = sessionStore.findUserId(
      loginRes.headers['set-cookie'][0].match(/sessionToken=([^;]+)/)[1]
    );
    const address = seedAddress(userId);

    const res = await agent.post(`/addresses/${address.id}/delete`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="empty-addresses"');
  });
});

describe('AC7: only addresses belonging to the logged-in user are displayed', () => {
  it('excludes addresses owned by other users', async () => {
    const agentA = request.agent(app);
    const { loginRes: loginResA } = await registerAndLogin(agentA);
    const userIdA = sessionStore.findUserId(
      loginResA.headers['set-cookie'][0].match(/sessionToken=([^;]+)/)[1]
    );
    seedAddress(userIdA, { streetAddress: '123 Main St' });

    const agentB = request.agent(app);
    const { loginRes: loginResB } = await registerAndLogin(agentB);
    const userIdB = sessionStore.findUserId(
      loginResB.headers['set-cookie'][0].match(/sessionToken=([^;]+)/)[1]
    );
    seedAddress(userIdB, { streetAddress: '999 Other User Ave' });

    const res = await agentA.get('/addresses');

    expect(res.text).toContain('123 Main St');
    expect(res.text).not.toContain('999 Other User Ave');
  });
});

describe('AC8: deleting another user\'s address is rejected and the list is unchanged', () => {
  it('returns 404 and leaves the other user\'s address list unchanged', async () => {
    const agentA = request.agent(app);
    await registerAndLogin(agentA);

    const agentB = request.agent(app);
    const { loginRes: loginResB } = await registerAndLogin(agentB);
    const userIdB = sessionStore.findUserId(
      loginResB.headers['set-cookie'][0].match(/sessionToken=([^;]+)/)[1]
    );
    const addressB = seedAddress(userIdB, { streetAddress: '999 Other User Ave' });

    const res = await agentA.post(`/addresses/${addressB.id}/delete`);

    expect(res.status).toBe(404);
    expect(addressStore.findById(addressB.id)).toBeDefined();

    const listResB = await agentB.get('/addresses');
    expect(listResB.text).toContain('999 Other User Ave');
  });
});

describe('Unauthenticated access redirects to the homepage', () => {
  it('redirects GET /addresses to / without a session cookie', async () => {
    const res = await request(app).get('/addresses');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });
});
