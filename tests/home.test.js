const request = require('supertest');
const app = require('../src/app');
const pizzaStore = require('../src/store/pizzaStore');

afterEach(() => {
  pizzaStore.reset();
});

function countOccurrences(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

describe('AC1: featured-pizzas section renders up to four flagged pizzas', () => {
  it('shows the SiteHeader and exactly the 4 featured pizzas with image, name, price, description', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);

    expect(res.text).toContain('Forno Rosso');
    expect(res.text).toContain('>Home<');
    expect(res.text).toContain('>Our Menu<');
    expect(res.text).toContain('>Cart<');
    expect(res.text).toContain('id="cartCount"');

    expect(countOccurrences(res.text, /class="pizza-card"/g)).toBe(4);

    expect(res.text).toContain('/images/pizzas/diavola.png');
    expect(res.text).toContain('Diavola');
    expect(res.text).toContain('$16.50');
    expect(res.text).toContain('Spicy calabrian salami');

    expect(res.text).toContain('/images/pizzas/funghi-selvatici-tartufo.png');
    expect(res.text).toContain('Funghi Selvatici &amp; Tartufo');
    expect(res.text).toContain('$18.00');

    expect(res.text).toContain('/images/pizzas/classic-margherita.png');
    expect(res.text).toContain('Classic Margherita');
    expect(res.text).toContain('$14.50');

    expect(res.text).toContain('/images/pizzas/prosciutto-crudo.png');
    expect(res.text).toContain('Prosciutto Crudo e Rucola');
    expect(res.text).toContain('$19.00');

    expect(res.text).not.toContain('Quattro Formaggi');
  });
});

describe('AC2: fewer than four featured pizzas shows only those, no placeholders', () => {
  it('renders exactly the featured pizzas returned by the backend', async () => {
    pizzaStore._setCatalog([
      {
        id: 'diavola',
        name: 'Diavola',
        price: '$16.50',
        description: 'Spicy calabrian salami.',
        image: '/images/pizzas/diavola.png',
        featured: true,
      },
      {
        id: 'classic-margherita',
        name: 'Classic Margherita',
        price: '$14.50',
        description: 'Imported San Marzano tomato sauce.',
        image: '/images/pizzas/classic-margherita.png',
        featured: true,
      },
    ]);

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(countOccurrences(res.text, /class="pizza-card"/g)).toBe(2);
    expect(res.text).toContain('Diavola');
    expect(res.text).toContain('Classic Margherita');
  });
});

describe('AC3: zero featured pizzas shows a graceful empty state', () => {
  it('renders an empty-state message and no pizza cards', async () => {
    pizzaStore._setCatalog([]);

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(countOccurrences(res.text, /class="pizza-card"/g)).toBe(0);
    expect(res.text).toContain('Popular Sourdough Pizzas');
    expect(res.text).toContain('No featured pizzas are available right now');
  });
});

describe('AC4: backend fetch failure or timeout shows an error state without breaking the page', () => {
  afterEach(() => {
    pizzaStore._setFailureMode(null);
  });

  it('shows an error message in the section while the rest of the page still renders', async () => {
    pizzaStore._setFailureMode('reject');

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(countOccurrences(res.text, /class="pizza-card"/g)).toBe(0);
    expect(res.text).toContain("couldn't load our featured pizzas");
    expect(res.text).toContain('Forno Rosso');
    expect(res.text).toContain('id="cartCount"');
  });
});
