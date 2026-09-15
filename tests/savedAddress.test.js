const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const sessionStore = require('../src/store/sessionStore');
const addressStore = require('../src/store/addressStore');
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
  addressStore.reset();
  emailService.reset();
});

describe('AC1: saved addresses are shown as selectable options at checkout', () => {
  it('lists a logged-in user saved address as a radio option on GET /cart', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);
    addressStore.save(user.id, {
      id: 'addr-1',
      recipientName: 'Jordan Rivera',
      streetAddress: '500 Main St',
      aptSuite: '',
      floor: '',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62704',
      country: 'USA',
      deliveryInstructions: '',
    });

    const res = await agent.get('/cart');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/<input[^>]*type="radio"[^>]*name="addressId"[^>]*value="addr-1"[^>]*>/);
    expect(res.text).toContain('500 Main St');
  });
});

describe('AC2: selecting a saved address pre-fills the checkout form', () => {
  it('pre-fills street address and city fields from the selected saved address', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);
    addressStore.save(user.id, {
      id: 'addr-1',
      recipientName: 'Jordan Rivera',
      streetAddress: '500 Main St',
      aptSuite: '',
      floor: '',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62704',
      country: 'USA',
      deliveryInstructions: '',
    });

    const res = await agent.get('/cart?addressId=addr-1');

    expect(res.text).toMatch(/id="street-address"[^>]*value="500 Main St"/);
    expect(res.text).toMatch(/id="city"[^>]*value="Springfield"/);
  });
});

describe('AC3: choosing "enter a new address" shows a blank delivery address form', () => {
  it('blanks the form and does not check the saved address radio', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);
    addressStore.save(user.id, { id: 'addr-1', streetAddress: '500 Main St' });

    const res = await agent.get('/cart?addressId=new');

    expect(res.text).toMatch(/id="street-address"[^>]*value=""/);
    expect(res.text).not.toMatch(/name="addressId"[^>]*value="addr-1"[^>]*checked/);
  });
});

describe('AC4: a logged-in user with no saved addresses sees the guest checkout form', () => {
  it('renders the plain delivery address form with no address selector', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const res = await agent.get('/cart');

    expect(res.status).toBe(200);
    expect(res.text).not.toContain('name="addressId"');
    expect(res.text).toContain('128 Pizzaiolo Boulevard');
  });
});

describe('AC5: a successful order with a new address offers to save it', () => {
  it('renders a save-address form after checkout with a brand new address', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const res = await agent.post('/checkout').type('form').send({
      recipientName: 'Jane Doe',
      streetAddress: '9 New Ave',
      city: 'Metropolis',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/action="\/checkout\/save-address"/);
    expect(res.text).toContain('Save this address to my account');
  });

  it('does not offer to save an address that already matches a saved address', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);
    addressStore.save(user.id, { id: 'addr-1', streetAddress: '500 Main St' });

    const res = await agent.post('/checkout').type('form').send({
      addressId: 'addr-1',
      streetAddress: '500 Main St',
    });

    expect(res.status).toBe(200);
    expect(res.text).not.toContain('action="/checkout/save-address"');
  });
});

describe('AC6: an invalid saved address is pruned from the account on checkout', () => {
  it('removes the invalid saved address and does not render it', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);
    addressStore.save(user.id, { id: 'bad-1', streetAddress: '' });

    const res = await agent.get('/cart');

    expect(addressStore.list(user.id)).toHaveLength(0);
    expect(res.text).not.toContain('value="bad-1"');
  });
});

describe('AC7: editing a minor field on a pre-filled saved address is accepted inline', () => {
  it('accepts apt/floor/instructions changes and echoes them on the checkout page', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);
    addressStore.save(user.id, {
      id: 'addr-1',
      streetAddress: '500 Main St',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62704',
      country: 'USA',
    });

    const res = await agent.post('/checkout').type('form').send({
      addressId: 'addr-1',
      streetAddress: '500 Main St',
      aptSuite: 'Unit 9',
      floor: '3',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62704',
      country: 'USA',
      deliveryInstructions: 'Leave with doorman',
    });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Unit 9');
    expect(res.text).toContain('Leave with doorman');
  });
});

describe('AC8: attempting to change a major field redirects to address management', () => {
  it('marks major fields readonly with a link to /account/addresses, leaving minor fields editable', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);
    addressStore.save(user.id, {
      id: 'addr-1',
      streetAddress: '500 Main St',
      city: 'Springfield',
    });

    const res = await agent.get('/cart?addressId=addr-1');

    expect(res.text).toMatch(/id="street-address"[^>]*readonly/);
    expect(res.text).toMatch(/id="city"[^>]*readonly/);
    expect(res.text).toMatch(/<a[^>]*href="\/account\/addresses"[^>]*>/);
    expect(res.text).not.toMatch(/id="apt-suite"[^>]*readonly/);
  });
});

describe('AC9: no saved address is pre-selected on initial checkout load', () => {
  it('leaves the form unfilled and no radio checked until the user picks one', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);
    addressStore.save(user.id, { id: 'addr-1', streetAddress: '500 Main St' });
    addressStore.save(user.id, { id: 'addr-2', streetAddress: '10 Other St' });

    const res = await agent.get('/cart');

    expect(res.text).not.toMatch(/name="addressId"[^>]*checked/);
    expect(res.text).toMatch(/id="street-address"[^>]*value=""/);
  });
});

describe('AC10: a failed address save is automatically retried once', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retries the save once and succeeds on the second attempt', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);
    const saveSpy = jest
      .spyOn(addressStore, 'save')
      .mockImplementationOnce(() => {
        throw new Error('write failed');
      });

    const res = await agent.post('/checkout/save-address').type('form').send({
      streetAddress: '9 New Ave',
      city: 'Metropolis',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    });

    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(res.text).toContain('Address saved to your account.');
  });
});

describe('AC11: the user is notified when the retried save also fails', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('notifies the user that the address was not saved', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);
    const saveSpy = jest.spyOn(addressStore, 'save').mockImplementation(() => {
      throw new Error('write failed');
    });

    const res = await agent.post('/checkout/save-address').type('form').send({
      streetAddress: '9 New Ave',
      city: 'Metropolis',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    });

    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(res.text).toMatch(/could not save|was not saved/i);
  });
});

describe('AC12: a new address is not saved once the user already has 10 saved addresses', () => {
  it('rejects the save and keeps the existing 10 addresses', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);
    for (let i = 0; i < 10; i += 1) {
      addressStore.save(user.id, { id: `addr-${i}`, streetAddress: `${i} Main St` });
    }

    const res = await agent.post('/checkout/save-address').type('form').send({
      streetAddress: '9 New Ave',
    });

    expect(addressStore.list(user.id)).toHaveLength(10);
    expect(res.text).toMatch(/already have 10 saved addresses/i);
  });
});

describe('AC13: a new address is added when the user has fewer than 10 saved addresses', () => {
  it('adds the new address to the saved addresses', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);

    const res = await agent.post('/checkout/save-address').type('form').send({
      streetAddress: '9 New Ave',
    });

    expect(res.status).toBe(200);
    expect(addressStore.list(user.id)).toHaveLength(1);
    expect(addressStore.list(user.id)[0].streetAddress).toBe('9 New Ave');
  });
});
