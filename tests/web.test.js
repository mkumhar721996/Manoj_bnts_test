const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const emailService = require('../src/services/emailService');

const generateValidPassword = () => `longenough${crypto.randomBytes(4).toString('hex')}`;

beforeEach(() => {
  userStore.reset();
  emailService.reset();
});

describe('MT-STORY-026 AC1: hero section with primary CTAs', () => {
  it('renders the hero heading and both primary CTAs pointing at the menu page', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Wood-Fired Pizza,');
    expect(res.text).toContain('Delivered Hot');
    expect(res.text).toMatch(/<a[^>]*href="\/menu"[^>]*>[\s\S]*?Order Online Now[\s\S]*?<\/a>/);
    expect(res.text).toMatch(/<a[^>]*href="\/menu"[^>]*>[\s\S]*?Explore Full Menu[\s\S]*?<\/a>/);
  });
});

describe('MT-STORY-026 AC2: delivery banner', () => {
  it('renders the free-delivery promotional banner with stats', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Free Delivery On Orders Over $35');
    expect(res.text).toContain(
      'Craving quality? Skip the delivery fee entirely inside our active zones.'
    );
    expect(res.text).toContain('Average ETA');
    expect(res.text).toContain('25 - 35 Min');
    expect(res.text).toContain('Pizza Temperature');
    expect(res.text).toContain('Piping Hot Guaranteed');
  });
});

describe('MT-STORY-026 AC3: chef-recommended pizza carousel', () => {
  it('renders each pizza card with an image, name, and Add to Order action', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Chef Recommendations');
    expect(res.text).toContain('Popular Sourdough Pizzas');

    const items = [
      { id: 'diavola', name: 'Diavola', image: '/images/pizza-diavola.png' },
      {
        id: 'funghi-tartufo',
        name: 'Funghi Selvatici &amp; Tartufo',
        image: '/images/pizza-funghi-tartufo.png',
      },
      { id: 'margherita', name: 'Classic Margherita', image: '/images/pizza-margherita.png' },
      {
        id: 'prosciutto-rucola',
        name: 'Prosciutto Crudo e Rucola',
        image: '/images/pizza-prosciutto-rucola.png',
      },
    ];

    items.forEach((item) => {
      expect(res.text).toContain(item.name);
      expect(res.text).toContain(`src="${item.image}"`);
      expect(res.text).toContain(`data-item-id="${item.id}"`);
      expect(res.text).toMatch(
        new RegExp(`data-item-id="${item.id}"[^>]*>[\\s\\S]*?Add to Order`)
      );
    });
  });
});

describe('MT-STORY-026 AC6: brand story section', () => {
  it('renders the brand story section with feature list and images', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('The Sourdough Secret');
    expect(res.text).toContain('Our Passion for the Perfect Crust');
    expect(res.text).toContain('100% Imported San Marzano Tomatoes');
    expect(res.text).toContain('Fior di Latte &amp; Fresh Mozzarella');
    expect(res.text).toContain('900°F Stone Hearth Wood Oven');
    expect(res.text).toContain('src="/images/story-dough.png"');
    expect(res.text).toContain('src="/images/story-oven.png"');
  });
});

describe('MT-STORY-026 AC7: navigation to the menu page', () => {
  it('points Order Online Now, Explore Full Menu, and Our Menu at /menu', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/<a[^>]*href="\/menu"[^>]*>[\s\S]*?Order Online Now[\s\S]*?<\/a>/);
    expect(res.text).toMatch(/<a[^>]*href="\/menu"[^>]*>[\s\S]*?Explore Full Menu[\s\S]*?<\/a>/);
    expect(res.text).toMatch(/<a[^>]*href="\/menu"[^>]*>Our Menu<\/a>/);
  });

  it('renders the menu page at GET /menu', async () => {
    const res = await request(app).get('/menu');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Our Menu');
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
