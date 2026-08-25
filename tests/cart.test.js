const request = require('supertest');
const app = require('../src/app');
const cartStore = require('../src/store/cartStore');

beforeEach(() => {
  cartStore.reset();
});

function round2(value) {
  return Math.round(value * 100) / 100;
}

describe('AC1: cart page loads with an empty promo field and Apply available', () => {
  it('renders an empty promo code input and an enabled Apply button', async () => {
    const res = await request(app).get('/cart');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toMatch(/Promo Code/i);
    expect(res.text).toMatch(/<input[^>]*name="promoCode"[^>]*value=""/);
    expect(res.text).not.toMatch(/<input[^>]*class="promo-input promo-input--applied"/);
    expect(res.text).toMatch(/<button[^>]*class="promo-btn"[^>]*>Apply<\/button>/);
    expect(res.text).not.toMatch(/>Applied</);
  });
});

describe('AC2: applying a recognised promo code shows discount, updated total, applied state', () => {
  it('applies FORNOROSSO10 and shows the discount, total, and confirmed applied field', async () => {
    const res = await request(app)
      .post('/cart/promo/apply')
      .type('form')
      .send({ promoCode: 'FORNOROSSO10' });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Discount/);
    expect(res.text).toMatch(/-\$5\.40/);
    expect(res.text).toMatch(/\$54\.82/);
    expect(res.text).toMatch(/class="promo-input promo-input--applied"[^>]*value="FORNOROSSO10"/);
    expect(res.text).toMatch(/<span class="promo-check-icon"/);
    expect(res.text).toMatch(/<button[^>]*class="promo-btn promo-btn-applied"[^>]*>Applied<\/button>/);
  });

  it('is case-insensitive and trims whitespace', async () => {
    const res = await request(app)
      .post('/cart/promo/apply')
      .type('form')
      .send({ promoCode: '  fornorosso10  ' });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/value="FORNOROSSO10"/);
    expect(cartStore.getCart().promoCode).toEqual({ code: 'FORNOROSSO10', discountPercent: 10 });
  });
});

describe('AC3: order summary shows subtotal, discount line, and a correctly-computed total', () => {
  it('shows subtotal, discount, and total that satisfy the subtotal-minus-discount relationship', async () => {
    await request(app).post('/cart/promo/apply').type('form').send({ promoCode: 'FORNOROSSO10' });
    const res = await request(app).get('/cart');

    expect(res.text).toMatch(/\$54\.00/);
    expect(res.text).toMatch(/-\$5\.40/);
    expect(res.text).toMatch(/\$54\.82/);

    const summary = cartStore.getSummary();
    expect(summary.total).toBe(
      round2(summary.subtotal - summary.discount + summary.deliveryFee + summary.ovenSurcharge + summary.salesTax)
    );
  });

  it('holds the same relationship for a different seeded subtotal', async () => {
    cartStore.reset({ subtotal: 100, deliveryFee: 0, ovenSurcharge: 2, salesTax: 8.5 });
    await request(app).post('/cart/promo/apply').type('form').send({ promoCode: 'FORNOROSSO10' });

    const summary = cartStore.getSummary();
    expect(summary.discount).toBe(10);
    expect(summary.total).toBe(
      round2(summary.subtotal - summary.discount + summary.deliveryFee + summary.ovenSurcharge + summary.salesTax)
    );
  });
});

describe('AC4: an unrecognised or invalid promo code shows an error', () => {
  it('shows an inline error and leaves the cart without a discount', async () => {
    const res = await request(app)
      .post('/cart/promo/apply')
      .type('form')
      .send({ promoCode: 'NOTAREALCODE' });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/not valid/i);
    expect(res.text).toMatch(/value="NOTAREALCODE"/);
    expect(res.text).toMatch(/promo-input--error/);
    expect(res.text).not.toMatch(/Discount/);
    expect(res.text).toMatch(/\$60\.22/);
    expect(res.text).toMatch(/<button[^>]*class="promo-btn"[^>]*>Apply<\/button>/);
    expect(cartStore.getCart().promoCode).toBeNull();
  });

  it('shows an error for a blank submission', async () => {
    const res = await request(app).post('/cart/promo/apply').type('form').send({ promoCode: '' });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/enter a promo code/i);
    expect(cartStore.getCart().promoCode).toBeNull();
  });

  it('escapes an attempted code containing HTML', async () => {
    const res = await request(app)
      .post('/cart/promo/apply')
      .type('form')
      .send({ promoCode: '<script>bad</script>' });

    expect(res.status).toBe(200);
    expect(res.text).not.toMatch(/<script>bad<\/script>/);
    expect(res.text).toMatch(/&lt;script&gt;bad&lt;\/script&gt;/);
  });
});

describe('AC5: removing an applied promo code reverts the total', () => {
  it('clears the discount and reverts to the pre-discount total', async () => {
    await request(app).post('/cart/promo/apply').type('form').send({ promoCode: 'FORNOROSSO10' });

    const res = await request(app).post('/cart/promo/remove');

    expect(res.status).toBe(200);
    expect(res.text).not.toMatch(/Discount/);
    expect(res.text).toMatch(/\$60\.22/);
    expect(res.text).toMatch(/<button[^>]*class="promo-btn"[^>]*>Apply<\/button>/);
    expect(cartStore.getCart().promoCode).toBeNull();
  });
});
