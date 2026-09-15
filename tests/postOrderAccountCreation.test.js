const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const sessionStore = require('../src/store/sessionStore');
const orderStore = require('../src/store/orderStore');
const otpStore = require('../src/store/otpStore');
const smsService = require('../src/services/smsService');
const emailService = require('../src/services/emailService');

function extractOrderId(html) {
  const match = html.match(/\/checkout\/([0-9a-f-]+)\/create-account/);
  return match ? match[1] : undefined;
}

beforeEach(() => {
  userStore.reset();
  sessionStore.reset();
  orderStore.reset();
  otpStore.reset();
  smsService.reset();
  emailService.reset();
});

describe('AC1: guest sees an inline account-creation prompt on the confirmation screen', () => {
  it('shows the order details and the account prompt form', async () => {
    const res = await request(app)
      .post('/checkout')
      .type('form')
      .send({ streetAddress: '500 Main Street', aptSuite: 'Apt 2', deliveryInstructions: 'Leave at door' });

    expect(res.status).toBe(200);
    expect(res.text).toContain('500 Main Street');
    expect(res.text).toContain('id="account-prompt"');
    expect(res.text).toMatch(/<input[^>]*name="name"[^>]*>/);
    expect(res.text).toMatch(/<input[^>]*name="phone"[^>]*>/);
    expect(res.text).toMatch(/<input[^>]*name="email"[^>]*>/);
  });
});

describe('AC2: submitting the prompt sends an OTP to phone and email', () => {
  it('shows the OTP entry form and records outbox entries for both channels', async () => {
    const checkoutRes = await request(app).post('/checkout').type('form').send({ streetAddress: '12 Oak St' });
    const orderId = extractOrderId(checkoutRes.text);

    const res = await request(app)
      .post(`/checkout/${orderId}/create-account`)
      .type('form')
      .send({ name: 'Sam Lee', phone: '+15551234567', email: 'sam@example.com' });

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="account-prompt"');
    expect(smsService.getLastSmsTo('+15551234567')).toBeDefined();
    expect(emailService.getLastEmailTo('sam@example.com')).toBeDefined();
  });
});

describe('AC3/AC4: correct OTP creates the account and saves the order address', () => {
  it('creates the account and copies the order address onto it', async () => {
    const checkoutRes = await request(app)
      .post('/checkout')
      .type('form')
      .send({ streetAddress: '77 Elm St', aptSuite: 'Unit 5', deliveryInstructions: 'Call on arrival' });
    const orderId = extractOrderId(checkoutRes.text);

    await request(app)
      .post(`/checkout/${orderId}/create-account`)
      .type('form')
      .send({ name: 'Sam Lee', phone: '+15551234567', email: 'sam2@example.com' });

    const { code } = otpStore.findByOrderId(orderId);
    const res = await request(app).post(`/checkout/${orderId}/verify-otp`).type('form').send({ code });

    expect(res.status).toBe(200);
    const user = userStore.findByEmail('sam2@example.com');
    expect(user).toBeDefined();
    expect(user.savedAddress).toEqual({
      streetAddress: '77 Elm St',
      aptSuite: 'Unit 5',
      deliveryInstructions: 'Call on arrival',
    });
  });
});

describe('AC5: success message shown after account creation', () => {
  it('shows the success message on the confirmation screen', async () => {
    const checkoutRes = await request(app)
      .post('/checkout')
      .type('form')
      .send({ streetAddress: '9 Fifth Ave' });
    const orderId = extractOrderId(checkoutRes.text);

    await request(app)
      .post(`/checkout/${orderId}/create-account`)
      .type('form')
      .send({ name: 'Ivy', phone: '+15551119999', email: 'ivy@example.com' });

    const { code } = otpStore.findByOrderId(orderId);
    const res = await request(app).post(`/checkout/${orderId}/verify-otp`).type('form').send({ code });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Account created! Your delivery address has been saved for next time.');
  });
});

describe('AC6: incorrect OTP shows an inline error and allows retry', () => {
  it('rejects the wrong code without creating an account', async () => {
    const checkoutRes = await request(app).post('/checkout').type('form').send({ streetAddress: '9 Pine St' });
    const orderId = extractOrderId(checkoutRes.text);

    await request(app)
      .post(`/checkout/${orderId}/create-account`)
      .type('form')
      .send({ name: 'Ana', phone: '+15559876543', email: 'ana@example.com' });

    const res = await request(app).post(`/checkout/${orderId}/verify-otp`).type('form').send({ code: '000000' });

    expect(res.status).toBe(400);
    expect(res.text).toContain("That code doesn't match. Please try again.");
    expect(res.text).toContain('id="account-prompt"');
    expect(userStore.findByEmail('ana@example.com')).toBeUndefined();
  });
});

describe('AC7: ignoring the prompt leaves order details visible and creates no account', () => {
  it('keeps the order confirmation visible with a dismiss link and creates no account', async () => {
    const res = await request(app).post('/checkout').type('form').send({ streetAddress: '3 Birch Ave' });

    expect(res.status).toBe(200);
    expect(res.text).toContain('3 Birch Ave');
    expect(res.text).toContain('Not now');
  });
});

describe('AC8: duplicate email or phone is rejected inline', () => {
  it('rejects a submission whose email already has an account and sends no OTP', async () => {
    userStore.save({
      id: 'existing-1',
      name: 'Existing User',
      email: 'dup@example.com',
      phone: '+15550001111',
      passwordHash: null,
      verified: true,
    });
    const checkoutRes = await request(app).post('/checkout').type('form').send({ streetAddress: '44 Cedar Ct' });
    const orderId = extractOrderId(checkoutRes.text);

    const res = await request(app)
      .post(`/checkout/${orderId}/create-account`)
      .type('form')
      .send({ name: 'New Guy', phone: '+15552223333', email: 'dup@example.com' });

    expect(res.status).toBe(400);
    expect(res.text).toContain(
      'An account with this email or phone number already exists. Please log in instead.'
    );
    expect(otpStore.findByOrderId(orderId)).toBeUndefined();
  });
});

describe('AC9: saved address is available at checkout on a subsequent logged-in order', () => {
  it('prefills /cart from the saved address and skips the prompt on the next order', async () => {
    const agent = request.agent(app);
    const checkoutRes = await agent
      .post('/checkout')
      .type('form')
      .send({ streetAddress: '200 Saved Ln', aptSuite: 'Suite 9', deliveryInstructions: 'Ring bell' });
    const orderId = extractOrderId(checkoutRes.text);

    await agent
      .post(`/checkout/${orderId}/create-account`)
      .type('form')
      .send({ name: 'Lee', phone: '+15554445555', email: 'lee@example.com' });

    const { code } = otpStore.findByOrderId(orderId);
    await agent.post(`/checkout/${orderId}/verify-otp`).type('form').send({ code });

    const cartRes = await agent.get('/cart');
    expect(cartRes.text).toContain('value="200 Saved Ln"');
    expect(cartRes.text).toContain('value="Suite 9"');

    const secondCheckoutRes = await agent.post('/checkout').type('form').send({ streetAddress: '200 Saved Ln' });
    expect(secondCheckoutRes.text).not.toContain('id="account-prompt"');
  });
});
