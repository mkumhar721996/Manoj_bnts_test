const request = require('supertest');
const app = require('../src/app');
const cartStore = require('../src/store/cartStore');

beforeEach(() => {
  cartStore.reset();
});

describe('AC1: line items show name, quantity, unit price, and line total', () => {
  it('renders each seeded line item with its name, quantity, unit price, and line total', async () => {
    const res = await request(app).get('/cart');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);

    expect(res.text).toContain('Classic Margherita');
    expect(res.text).toContain('$14.50');
    expect(res.text).toContain('$29.00');

    expect(res.text).toContain('Diavola');
    expect(res.text).toContain('$16.50');

    expect(res.text).toContain('Rosemary Garlic Focaccia');
    expect(res.text).toContain('$8.50');
  });
});

describe('AC2: changing quantity via the stepper updates line total and subtotal immediately', () => {
  it('increments quantity and updates the line total and subtotal in the same response', async () => {
    const res = await request(app).post('/cart/items/classic-margherita/increment');

    expect(res.status).toBe(200);
    expect(res.text).toContain('$43.50');
    expect(res.text).toContain('$68.50');
  });
});

function extractRow(html, marker) {
  const start = html.indexOf(marker);
  const rowStart = html.lastIndexOf('<div class="cart-line-item">', start);
  const rowEnd = html.indexOf('<div class="cart-line-item">', start + marker.length);
  return html.slice(rowStart, rowEnd === -1 ? undefined : rowEnd);
}

describe('AC3: decrement control is disabled at quantity one', () => {
  it('renders the decrement button disabled for a quantity-one item but not for a quantity-two item', async () => {
    const res = await request(app).get('/cart');

    expect(res.status).toBe(200);
    const diavolaRow = extractRow(res.text, 'Diavola');
    expect(diavolaRow).toMatch(/<button[^>]*disabled[^>]*>&minus;/);

    const margheritaRow = extractRow(res.text, 'Classic Margherita');
    expect(margheritaRow).not.toMatch(/<button[^>]*disabled[^>]*>&minus;/);
  });

  it('keeps the quantity at one and the button disabled when a decrement is attempted', async () => {
    const res = await request(app).post('/cart/items/diavola/decrement');

    expect(res.status).toBe(200);
    const diavolaRow = extractRow(res.text, 'Diavola');
    expect(diavolaRow).toMatch(/<button[^>]*disabled[^>]*>&minus;/);
    expect(res.text).toContain('$16.50');
  });
});

describe('AC4: removing a line item hides its row and decrements the header badge', () => {
  it('removes the item row and decrements the cart badge count', async () => {
    const before = await request(app).get('/cart');
    expect(before.text).toContain('cart-badge">3<');

    const res = await request(app).post('/cart/items/classic-margherita/remove');

    expect(res.status).toBe(200);
    expect(res.text).not.toContain('Classic Margherita');
    expect(res.text).toContain('2 Items');
    expect(res.text).toContain('cart-badge">2<');
  });
});

describe('AC5: empty cart shows an empty state', () => {
  it('shows an empty cart message once every item has been removed', async () => {
    await request(app).post('/cart/items/classic-margherita/remove');
    await request(app).post('/cart/items/diavola/remove');
    const res = await request(app).post('/cart/items/rosemary-garlic-focaccia/remove');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Your cart is empty.');
    expect(res.text).toContain('0 Items');
    expect(res.text).toContain('cart-badge">0<');

    const followUp = await request(app).get('/cart');
    expect(followUp.text).toContain('Your cart is empty.');
  });
});
