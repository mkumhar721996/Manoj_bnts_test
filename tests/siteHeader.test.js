const request = require('supertest');
const app = require('../src/app');
const cartStore = require('../src/store/cartStore');

beforeEach(() => {
  cartStore.reset();
});

describe('AC1: header renders logo, nav links, delivery ETA, and cart badge', () => {
  it('renders the Forno Rosso brand, nav links, ETA, and cart badge on the home page', async () => {
    cartStore.addItem(3);

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Forno Rosso');
    expect(res.text).toContain('>F<');
    expect(res.text).toMatch(/<a[^>]*href="\/"[^>]*>\s*Home\s*<\/a>/);
    expect(res.text).toMatch(/<a[^>]*href="\/menu"[^>]*>\s*Our Menu\s*<\/a>/);
    expect(res.text).toMatch(/<a[^>]*href="\/cart"[^>]*>\s*Cart\s*<\/a>/);
    expect(res.text).toContain('Estimated delivery:');
    expect(res.text).toContain('30 mins');
    expect(res.text).toMatch(/<span id="cart-badge"[^>]*>3<\/span>/);
  });
});

describe('AC2: header stays fixed to the top of the viewport on scroll', () => {
  it('ships a sticky, top-pinned .site-header rule in the page stylesheet', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    const styleMatch = res.text.match(/\.site-header\s*{[^}]*}/);
    expect(styleMatch).not.toBeNull();
    expect(styleMatch[0]).toMatch(/position:\s*sticky/);
    expect(styleMatch[0]).toMatch(/top:\s*0/);
  });
});

describe('AC3: clicking Home navigates to the home page', () => {
  it('marks Home active on / and links Home to / from other pages', async () => {
    const home = await request(app).get('/');
    expect(home.status).toBe(200);
    const homeLinkMatch = home.text.match(/<a[^>]*href="\/"[^>]*>\s*Home\s*<\/a>/);
    expect(homeLinkMatch[0]).toContain('is-active');

    const menu = await request(app).get('/menu');
    expect(menu.status).toBe(200);
    const homeLinkFromMenu = menu.text.match(/<a[^>]*href="\/"[^>]*>\s*Home\s*<\/a>/);
    expect(homeLinkFromMenu[0]).not.toContain('is-active');
  });
});

describe('AC4: clicking Our Menu navigates to the menu page', () => {
  it('serves the menu page at /menu with Our Menu marked active', async () => {
    const res = await request(app).get('/menu');

    expect(res.status).toBe(200);
    expect(res.text).toContain('<h1>Our Menu</h1>');
    const navLinkMatch = res.text.match(/<a[^>]*href="\/menu"[^>]*>\s*Our Menu\s*<\/a>/);
    expect(navLinkMatch[0]).toContain('is-active');
  });
});

describe('AC5: clicking the cart icon or Cart link navigates to the cart page', () => {
  it('serves the cart page at /cart with Cart marked active, and the cart button links there too', async () => {
    const res = await request(app).get('/cart');

    expect(res.status).toBe(200);
    expect(res.text).toContain('<h1>Your Cart</h1>');
    const navLinkMatch = res.text.match(/<a[^>]*href="\/cart"[^>]*>\s*Cart\s*<\/a>/);
    expect(navLinkMatch[0]).toContain('is-active');
    expect(res.text).toMatch(/<a[^>]*href="\/cart"[^>]*class="cart-indicator-btn"[^>]*>|<a[^>]*class="cart-indicator-btn"[^>]*href="\/cart"[^>]*>/);
  });
});

describe('AC6: zero items in the cart hides the numeric badge', () => {
  it('does not render a visible digit when the cart is empty', async () => {
    cartStore.reset();

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    const badgeMatch = res.text.match(/<span id="cart-badge"[^>]*>.*?<\/span>/s);
    expect(badgeMatch[0]).toContain('hidden');
  });
});

describe('AC7: one or more items shows the correct running total', () => {
  it('reflects the live cart count in the badge', async () => {
    cartStore.addItem(5);

    let res = await request(app).get('/');
    expect(res.text).toMatch(/<span id="cart-badge"[^>]*>5<\/span>/);
    expect(res.text).not.toMatch(/<span id="cart-badge"[^>]*hidden[^>]*>5<\/span>/);

    cartStore.addItem(2);

    res = await request(app).get('/');
    expect(res.text).toMatch(/<span id="cart-badge"[^>]*>7<\/span>/);
  });
});
