const request = require('supertest');
const app = require('../src/app');

describe('AC1: delivery details form visible on the cart page', () => {
  it('renders the Delivery Destination card with street address, apt/suite, and instructions fields', async () => {
    const res = await request(app).get('/cart');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Delivery Destination');
    expect(res.text).toMatch(/<label[^>]*for="street-address"[^>]*>Street Address<\/label>/);
    expect(res.text).toMatch(/<input[^>]*id="street-address"[^>]*name="streetAddress"[^>]*>/);
    expect(res.text).toMatch(/<label[^>]*for="apt-suite"[^>]*>Apt \/ Suite<\/label>/);
    expect(res.text).toMatch(/<input[^>]*id="apt-suite"[^>]*name="aptSuite"[^>]*>/);
    expect(res.text).toMatch(
      /<label[^>]*for="delivery-instructions"[^>]*>Special Delivery Instructions<\/label>/
    );
    expect(res.text).toMatch(
      /<textarea[^>]*id="delivery-instructions"[^>]*name="deliveryInstructions"[^>]*>/
    );
    expect(res.text).toContain('Proceed to Checkout');
  });
});

describe('AC2: missing street address blocks checkout', () => {
  it('shows a validation error on the street address field and preserves the other fields', async () => {
    const res = await request(app)
      .post('/checkout')
      .type('form')
      .send({ streetAddress: '', aptSuite: 'Unit 3', deliveryInstructions: '' });

    expect(res.status).toBe(400);
    expect(res.text).toContain('Street address is required.');
    expect(res.text).toMatch(/id="street-address"[^>]*aria-invalid="true"/);
    expect(res.text).toContain('value="Unit 3"');
  });
});

describe('AC3: valid street address hands off to checkout with details preserved', () => {
  it('preserves the delivery details and renders the checkout page', async () => {
    const res = await request(app)
      .post('/checkout')
      .type('form')
      .send({
        streetAddress: '500 Main Street',
        aptSuite: 'Apt 2',
        deliveryInstructions: 'Leave at door',
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain('500 Main Street');
    expect(res.text).toContain('Apt 2');
    expect(res.text).toContain('Leave at door');
  });
});

describe('AC4: blank delivery instructions is not a validation error', () => {
  it('allows checkout to proceed with no delivery instructions', async () => {
    const res = await request(app)
      .post('/checkout')
      .type('form')
      .send({ streetAddress: '500 Main Street', aptSuite: '', deliveryInstructions: '' });

    expect(res.status).toBe(200);
    expect(res.text).not.toMatch(/instructions.*required/i);
    expect(res.text).not.toContain('class="field-error"');
  });
});
