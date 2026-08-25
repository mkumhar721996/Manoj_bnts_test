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

describe('MT-STORY-038 AC1: hero section renders on home page load', () => {
  it('renders the hero headline, description, and both CTA buttons', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('class="hero-section"');
    expect(res.text).toMatch(/<h1 class="hero-heading">\s*Wood-Fired Pizza,\s*<span class="hero-heading-highlight">Delivered Hot<\/span>/);
    expect(res.text).toContain(
      'Baked at 900°F in our stone ovens to perfect charred perfection. Handcrafted sourdough bases fermented for 48 hours. Order now for fast, direct thermal-bag delivery.'
    );
    expect(res.text).toContain('AUTHENTIC NEAPOLITAN WOODFIRED');
    expect(res.text).toMatch(/<a[^>]*class="btn-hero-primary"[^>]*>[\s\S]*?Order Online Now[\s\S]*?<\/a>/);
    expect(res.text).toMatch(/<a[^>]*class="btn-hero-secondary"[^>]*>\s*Explore Full Menu\s*<\/a>/);
  });
});

describe('MT-STORY-038 AC2: hero CTAs navigate to the menu page', () => {
  it('points both hero CTAs at /menu', async () => {
    const res = await request(app).get('/');

    expect(res.text).toMatch(/<a href="\/menu" class="btn-hero-primary"/);
    expect(res.text).toMatch(/<a href="\/menu" class="btn-hero-secondary"/);
  });

  it('serves a stub menu page at /menu', async () => {
    const res = await request(app).get('/menu');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('<h1>Our Menu</h1>');
    expect(res.text).toContain('Full menu coming soon.');
  });
});

describe('MT-STORY-038 AC3: hero is responsive on mobile viewports', () => {
  it('stacks the hero layout and CTAs, and shrinks the heading, under a 640px breakpoint', async () => {
    const res = await request(app).get('/');

    const mediaMatch = res.text.match(/@media \(max-width: 640px\) \{([\s\S]*?)\n\}/);
    expect(mediaMatch).not.toBeNull();
    const mediaBlock = mediaMatch[1];

    expect(mediaBlock).toMatch(/\.hero-section\s*\{[^}]*flex-direction:\s*column/);
    expect(mediaBlock).toMatch(/\.hero-cta-group\s*\{[^}]*flex-direction:\s*column/);
    expect(mediaBlock).toMatch(/\.hero-heading\s*\{[^}]*font-size:\s*40px/);

    expect(res.text).toMatch(/\.hero-image-wrapper\s*\{[^}]*max-width:\s*100%/);
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
