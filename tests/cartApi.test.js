const request = require('supertest');
const app = require('../src/app');
const cartStore = require('../src/store/cartStore');

beforeEach(() => {
  cartStore.reset();
});

describe('AC8: cart count can change independently of any page render', () => {
  it('starts at 0 and increments via POST without a page reload', async () => {
    const visitor = request.agent(app);

    const initial = await visitor.get('/api/cart');
    expect(initial.status).toBe(200);
    expect(initial.body).toEqual({ count: 0 });

    const posted = await visitor.post('/api/cart/items').send({ quantity: 2 });
    expect(posted.status).toBe(200);
    expect(posted.body).toEqual({ count: 2 });

    const after = await visitor.get('/api/cart');
    expect(after.status).toBe(200);
    expect(after.body).toEqual({ count: 2 });
  });
});

describe('cart state is scoped per visitor, not shared globally', () => {
  it('does not leak one anonymous visitor\'s cart count to another visitor', async () => {
    const visitorA = request.agent(app);
    const visitorB = request.agent(app);

    const addedByA = await visitorA.post('/api/cart/items').send({ quantity: 5 });
    expect(addedByA.body).toEqual({ count: 5 });

    const seenByB = await visitorB.get('/api/cart');
    expect(seenByB.body).toEqual({ count: 0 });

    const seenByA = await visitorA.get('/api/cart');
    expect(seenByA.body).toEqual({ count: 5 });
  });
});
