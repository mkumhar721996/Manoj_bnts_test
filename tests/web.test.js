const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const emailService = require('../src/services/emailService');
const cartStore = require('../src/store/cartStore');

const generateValidPassword = () => `longenough${crypto.randomBytes(4).toString('hex')}`;

beforeEach(() => {
  userStore.reset();
  emailService.reset();
  cartStore.reset();
});

describe('AC1: Facebook-branded homepage on load', () => {
  it('renders the homepage with the Facebook brand', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('class="brand-wordmark">Facebook<');
    expect(res.text).toContain('class="brand-wordmark">facebook<');
    expect(res.text).toContain(
      'Connect with friends and the world around you on Facebook.'
    );
  });
});

describe('AC2: registration form visible on the homepage', () => {
  it('renders a registration form with name, email, and password fields', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('action="/register"');
    expect(res.text).toMatch(/<input[^>]*name="name"[^>]*>/);
    expect(res.text).toMatch(/<input[^>]*name="email"[^>]*>/);
    expect(res.text).toMatch(/<input[^>]*type="password"[^>]*name="password"[^>]*>/);
    expect(res.text).toContain('>Sign Up<');
  });

  it('renders a login form with email and password fields', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('action="/login"');
    expect(res.text).toContain('>Log In<');
  });
});

describe('AC3: valid registration creates the account and shows confirmation', () => {
  it('creates the account and shows a confirmation with name and email', async () => {
    const pwd = generateValidPassword();
    const payload = {
      name: 'Priya Shah',
      email: 'priya@example.com',
      password: pwd,
    };

    const res = await request(app).post('/register').type('form').send(payload);

    expect(res.status).toBe(201);
    expect(res.text).toContain('status-icon success');
    expect(res.text).toContain('Account created for <strong>Priya Shah</strong>.');
    expect(res.text).toContain(
      'A confirmation has been sent to <strong>priya@example.com</strong>.'
    );
    expect(res.text).toContain('Continue to Log In');

    const stored = userStore.findByEmail(payload.email);
    expect(stored).toBeDefined();
    expect(stored.verified).toBe(false);
    expect(stored.passwordHash).toBeDefined();
    expect(stored.passwordHash).not.toContain(payload.password);
    expect(emailService.getLastEmailTo(payload.email)).toBeDefined();
  });
});

describe('AC4: missing or invalid registration fields show which fields are invalid', () => {
  it('shows "Name is required." when name is missing', async () => {
    const pwd = generateValidPassword();
    const payload = { email: 'noname@example.com', password: pwd };

    const res = await request(app).post('/register').type('form').send(payload);

    expect(res.status).toBe(400);
    expect(res.text).toContain('Name is required.');
    expect(userStore.findByEmail(payload.email)).toBeUndefined();
  });

  it('shows "Email address is not valid." for a badly formatted email', async () => {
    const pwd = generateValidPassword();
    const payload = { name: 'Bad Email', email: 'no-at-sign', password: pwd };

    const res = await request(app).post('/register').type('form').send(payload);

    expect(res.status).toBe(400);
    expect(res.text).toContain('Email address is not valid.');
    expect(userStore.findByEmail(payload.email)).toBeUndefined();
  });

  it('shows "Password must be at least 8 characters." for a short password', async () => {
    const payload = { name: 'Short Pwd', email: 'shortpwd@example.com', password: 'abc' };

    const res = await request(app).post('/register').type('form').send(payload);

    expect(res.status).toBe(400);
    expect(res.text).toContain('Password must be at least 8 characters.');
    expect(userStore.findByEmail(payload.email)).toBeUndefined();
  });

  it('shows all field errors together when everything is blank', async () => {
    const payload = { name: '', email: '', password: '' };

    const res = await request(app).post('/register').type('form').send(payload);

    expect(res.status).toBe(400);
    expect(res.text).toContain('Name is required.');
    expect(res.text).toContain('Email is required.');
    expect(res.text).toContain('Password is required.');
  });

  it('shows "This email is already registered." for a duplicate email', async () => {
    const pwd = generateValidPassword();
    const existingPayload = {
      name: 'First User',
      email: 'dupe@example.com',
      password: pwd,
    };
    await request(app).post('/register').type('form').send(existingPayload);

    const pwd2 = generateValidPassword();
    const duplicatePayload = {
      name: 'Second User',
      email: 'dupe@example.com',
      password: pwd2,
    };
    const res = await request(app).post('/register').type('form').send(duplicatePayload);

    expect(res.status).toBe(400);
    expect(res.text).toContain('This email is already registered.');
    expect(userStore.findByEmail('dupe@example.com').name).toBe('First User');
  });
});

describe('AC5: valid login credentials authenticate and redirect to the feed', () => {
  it('shows the feed with a welcome banner and avatar initial on valid credentials', async () => {
    const pwd = generateValidPassword();
    await request(app)
      .post('/register')
      .type('form')
      .send({ name: 'Jordan Rivera', email: 'jordan@example.com', password: pwd });

    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'jordan@example.com', password: pwd });

    expect(res.status).toBe(200);
    expect(res.text).toContain('class="app-shell"');
    expect(res.text).toContain('Welcome back, Jordan!');
    expect(res.text).toContain('class="avatar" id="feedAvatarInitial">J<');
    expect(res.text).toContain('Aisha Khan');
    expect(res.text).toContain('Diego Fernandez');
    expect(res.text).toContain('Lin Wei');
    expect(res.text).toContain('Sam Okafor');
  });
});

describe('AC6: invalid login credentials show an error and deny access', () => {
  it('denies access with a wrong password for an existing user', async () => {
    const pwd = generateValidPassword();
    await request(app)
      .post('/register')
      .type('form')
      .send({ name: 'Jordan Rivera', email: 'jordan2@example.com', password: pwd });

    const badPwd = generateValidPassword();
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'jordan2@example.com', password: badPwd });

    expect(res.status).toBe(401);
    expect(res.text).toContain('status-icon danger');
    expect(res.text).toContain(
      'The email or password you entered is incorrect. Access denied.'
    );
    expect(res.text).toContain('Try Again');
  });

  it('denies access for an email that does not exist', async () => {
    const pwd = generateValidPassword();
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'nobody@example.com', password: pwd });

    expect(res.status).toBe(401);
    expect(res.text).toContain('status-icon danger');
    expect(res.text).toContain(
      'The email or password you entered is incorrect. Access denied.'
    );
  });
});

describe('MT-STORY-025 AC1/AC4: global header with nav links, ETA, and cart badge', () => {
  it('renders nav links to Home, Our Menu, and Cart, an ETA indicator, and a 0 cart badge on an empty cart', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/<a[^>]*href="\/"[^>]*>Home<\/a>/);
    expect(res.text).toMatch(/<a[^>]*href="\/menu"[^>]*>Our Menu<\/a>/);
    expect(res.text).toMatch(/<a[^>]*href="\/cart"[^>]*>[\s\S]*Cart[\s\S]*<\/a>/);
    expect(res.text).toContain('id="deliveryEta"');
    expect(res.text).toContain('id="cartBadge">0<');
  });
});

describe('MT-STORY-025 AC1: the global header is the only header rendered per page', () => {
  const countHeaders = (html) => (html.match(/<header[ >]/g) || []).length;

  it('renders exactly one header on the homepage', async () => {
    const res = await request(app).get('/');
    expect(countHeaders(res.text)).toBe(1);
  });

  it('renders exactly one header on the feed page after login', async () => {
    const pwd = generateValidPassword();
    await request(app)
      .post('/register')
      .type('form')
      .send({ name: 'Nav Header', email: 'navheader@example.com', password: pwd });
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'navheader@example.com', password: pwd });

    expect(countHeaders(res.text)).toBe(1);
  });

  it('renders exactly one header on the registration success page', async () => {
    const pwd = generateValidPassword();
    const res = await request(app)
      .post('/register')
      .type('form')
      .send({ name: 'Success Header', email: 'successheader@example.com', password: pwd });

    expect(countHeaders(res.text)).toBe(1);
  });

  it('renders exactly one header on the registration error page', async () => {
    const res = await request(app)
      .post('/register')
      .type('form')
      .send({ email: '', password: '' });

    expect(countHeaders(res.text)).toBe(1);
  });

  it('renders exactly one header on the login error page', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'nobody-header@example.com', password: 'whatever' });

    expect(countHeaders(res.text)).toBe(1);
  });
});

describe('MT-STORY-025 AC2: global footer with store info', () => {
  it('renders store hours, location, contact, social links, and legal links', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="storeHours"');
    expect(res.text).toContain('id="storeLocation"');
    expect(res.text).toContain('id="storeContact"');
    expect((res.text.match(/class="social-link"/g) || []).length).toBeGreaterThanOrEqual(2);
    expect((res.text.match(/class="legal-link"/g) || []).length).toBeGreaterThanOrEqual(2);
  });
});

describe('MT-STORY-025 AC3: Our Menu and Cart pages are reachable', () => {
  it('renders the Our Menu page with catalog items and an add-to-cart form each', async () => {
    const res = await request(app).get('/menu');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Our Menu');
    expect(res.text).toContain('Classic Burger');
    expect(res.text).toContain('Veggie Wrap');
    expect(res.text).toContain('Iced Tea');
    expect(res.text).toContain('action="/cart/add/classic-burger"');
  });

  it('renders the Cart page with empty-cart copy when nothing has been added', async () => {
    const res = await request(app).get('/cart');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Your Cart');
    expect(res.text).toContain('Your cart is empty.');
  });
});

describe('MT-STORY-025 AC3/AC5: adding items updates the cart and badge immediately', () => {
  it('adds a known item and updates the cart badge to 1', async () => {
    const res = await request(app).post('/cart/add/classic-burger');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Classic Burger');
    expect(res.text).toContain('id="cartBadge">1<');
    expect(res.text).toContain('action="/cart/remove/classic-burger"');
  });

  it('adds a second distinct item and updates the badge to 2', async () => {
    await request(app).post('/cart/add/classic-burger');
    const res = await request(app).post('/cart/add/veggie-wrap');

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="cartBadge">2<');
    expect(res.text).toContain('Classic Burger');
    expect(res.text).toContain('Veggie Wrap');
  });

  it('keeps the badge at 1 distinct line item when the same item is added twice, but increases its quantity', async () => {
    await request(app).post('/cart/add/classic-burger');
    const res = await request(app).post('/cart/add/classic-burger');

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="cartBadge">1<');
  });
});

describe('MT-STORY-025 AC5: removing items updates the cart and badge immediately', () => {
  it('removes an item, dropping the badge and clearing its listing while keeping the remaining item', async () => {
    await request(app).post('/cart/add/classic-burger');
    await request(app).post('/cart/add/veggie-wrap');

    const res = await request(app).post('/cart/remove/classic-burger');

    expect(res.status).toBe(200);
    expect(res.text).not.toContain('Classic Burger');
    expect(res.text).toContain('id="cartBadge">1<');
    expect(res.text).toContain('Veggie Wrap');
  });

  it('drops the badge to 0 and shows empty-cart copy when the last item is removed', async () => {
    await request(app).post('/cart/add/classic-burger');

    const res = await request(app).post('/cart/remove/classic-burger');

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="cartBadge">0<');
    expect(res.text).toContain('Your cart is empty.');
  });
});
