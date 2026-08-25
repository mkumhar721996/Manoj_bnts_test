const request = require('supertest');
const app = require('../src/app');
const cartStore = require('../src/store/cartStore');

beforeEach(() => {
  cartStore.reset();
});

describe('AC8: cart count can change independently of any page render', () => {
  it('starts at 0 and increments via POST without a page reload', async () => {
    const initial = await request(app).get('/api/cart');
    expect(initial.status).toBe(200);
    expect(initial.body).toEqual({ count: 0 });

    const posted = await request(app).post('/api/cart/items').send({ quantity: 2 });
    expect(posted.status).toBe(200);
    expect(posted.body).toEqual({ count: 2 });

    const after = await request(app).get('/api/cart');
    expect(after.status).toBe(200);
    expect(after.body).toEqual({ count: 2 });
  });
});
