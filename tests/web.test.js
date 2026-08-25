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

describe('MT-STORY-041 AC1: brand story section renders on the home page', () => {
  it('renders the "Our Passion for the Perfect Crust" heading', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('class="story-heading__title">Our Passion for the Perfect Crust<');
  });
});

describe('MT-STORY-041 AC2: brand story body copy references key sourcing/craft facts', () => {
  it('mentions San Marzano tomatoes, fresh mozzarella, and the 900°F wood oven', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('San Marzano Tomatoes');
    expect(res.text).toContain('Fresh Mozzarella');
    expect(res.text).toContain('900°F Stone Hearth Wood Oven');
  });
});

describe('MT-STORY-041 AC3: brand story supporting photos are visible', () => {
  it('renders an img tag for each configured story image', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain(
      'class="story-images__photo" src="/images/story/dough-prep.jpg"'
    );
    expect(res.text).toContain(
      'class="story-images__photo" src="/images/story/wood-oven.jpg"'
    );
  });

  it('serves the story photos as real static image files', async () => {
    const doughRes = await request(app).get('/images/story/dough-prep.jpg');
    const ovenRes = await request(app).get('/images/story/wood-oven.jpg');

    expect(doughRes.status).toBe(200);
    expect(doughRes.headers['content-type']).toMatch(/image\//);
    expect(ovenRes.status).toBe(200);
    expect(ovenRes.headers['content-type']).toMatch(/image\//);
  });
});

describe('MT-STORY-041 AC4: brand story is legible on mobile without horizontal scrolling', () => {
  it('collapses the two-column grid to one column and makes photos fluid-width under 860px', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(
      /@media \(max-width: 860px\)[^}]*\{[^}]*\.brand-story__grid\s*\{[^}]*grid-template-columns:\s*1fr/s
    );
    expect(res.text).toMatch(
      /\.story-images__photo\s*\{[^}]*max-width:\s*100%/s
    );
  });

  it('does not let two fixed/full-width photos both claim a full flex row (no combined overflow)', async () => {
    const res = await request(app).get('/');
    const styleBlock = res.text.slice(res.text.indexOf('<style>'), res.text.indexOf('</style>'));

    const baseRuleMatch = styleBlock.match(/\.story-images__photo\s*\{([^}]*)\}/s);
    expect(baseRuleMatch).not.toBeNull();
    expect(baseRuleMatch[1]).not.toMatch(/flex:\s*1\s*;/);

    const mediaBlocks = styleBlock.match(/@media \(max-width: 860px\)\s*\{[\s\S]*?\n\}/g) || [];
    const storyMediaBlock = mediaBlocks.find((block) => block.includes('.story-images'));
    expect(storyMediaBlock).toBeTruthy();
    expect(storyMediaBlock).toMatch(/\.story-images\s*\{[^}]*flex-direction:\s*column/s);
  });

  it('only loads the brand-story Google Fonts on the home page, not on unrelated pages', async () => {
    const homeRes = await request(app).get('/');
    expect(homeRes.text).toContain('fonts.googleapis.com');

    const badLoginRes = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'nobody@example.com', password: 'irrelevant123' });
    expect(badLoginRes.text).not.toContain('fonts.googleapis.com');
  });
});

describe('MT-STORY-041 AC5: brand story content is a static module, not CMS/admin-backed', () => {
  it('exports a plain static object with heading, paragraph, features, and images', () => {
    const brandStory = require('../src/content/brandStory');

    expect(typeof brandStory.eyebrow).toBe('string');
    expect(brandStory.heading).toBe('Our Passion for the Perfect Crust');
    expect(brandStory.paragraph).toContain('At Forno Rosso');

    expect(Array.isArray(brandStory.features)).toBe(true);
    expect(brandStory.features).toHaveLength(3);
    brandStory.features.forEach((feature) => {
      expect(typeof feature.icon).toBe('string');
      expect(typeof feature.title).toBe('string');
      expect(typeof feature.description).toBe('string');
    });

    expect(Array.isArray(brandStory.images)).toBe(true);
    expect(brandStory.images).toHaveLength(2);
    brandStory.images.forEach((image) => {
      expect(typeof image.src).toBe('string');
      expect(typeof image.alt).toBe('string');
    });
  });

  it('renders identical brand story content across requests with no seeded or admin state', async () => {
    userStore.reset();

    const first = await request(app).get('/');
    const second = await request(app).get('/');

    const extractStory = (text) => text.slice(text.indexOf('class="brand-story"'));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(extractStory(first.text)).toBe(extractStory(second.text));
    expect(first.text).toContain('Our Passion for the Perfect Crust');
    expect(first.text).toContain('At Forno Rosso');
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
