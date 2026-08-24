const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');

const generateValidPassword = () => `longenough${crypto.randomBytes(4).toString('hex')}`;

beforeEach(() => {
  userStore.reset();
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
    const payload = {
      name: 'Priya Shah',
      email: 'priya@example.com',
      password: generateValidPassword(),
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
    expect(stored.verified).toBe(true);
    expect(stored.passwordHash).toBeDefined();
    expect(stored.passwordHash).not.toContain(payload.password);
  });
});

describe('AC4: missing or invalid registration fields show which fields are invalid', () => {
  it('shows "Name is required." when name is missing', async () => {
    const payload = { email: 'noname@example.com', password: generateValidPassword() };

    const res = await request(app).post('/register').type('form').send(payload);

    expect(res.status).toBe(400);
    expect(res.text).toContain('Name is required.');
    expect(userStore.findByEmail(payload.email)).toBeUndefined();
  });

  it('shows "Email address is not valid." for a badly formatted email', async () => {
    const payload = { name: 'Bad Email', email: 'no-at-sign', password: generateValidPassword() };

    const res = await request(app).post('/register').type('form').send(payload);

    expect(res.status).toBe(400);
    expect(res.text).toContain('Email address is not valid.');
    expect(userStore.findByEmail(payload.email)).toBeUndefined();
  });

  it('shows "Password must be at least 8 characters." for a short password', async () => {
    const payload = { name: 'Short Pwd', email: 'shortpwd@example.com', password: 'abc123' };

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
    const existingPayload = {
      name: 'First User',
      email: 'dupe@example.com',
      password: generateValidPassword(),
    };
    await request(app).post('/register').type('form').send(existingPayload);

    const duplicatePayload = {
      name: 'Second User',
      email: 'dupe@example.com',
      password: generateValidPassword(),
    };
    const res = await request(app).post('/register').type('form').send(duplicatePayload);

    expect(res.status).toBe(400);
    expect(res.text).toContain('This email is already registered.');
    expect(userStore.findByEmail('dupe@example.com').name).toBe('First User');
  });
});

describe('AC5: valid login credentials authenticate and redirect to the feed', () => {
  it('shows the feed with a welcome banner and avatar initial on valid credentials', async () => {
    const password = generateValidPassword();
    await request(app)
      .post('/register')
      .type('form')
      .send({ name: 'Jordan Rivera', email: 'jordan@example.com', password });

    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'jordan@example.com', password });

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
    const password = generateValidPassword();
    await request(app)
      .post('/register')
      .type('form')
      .send({ name: 'Jordan Rivera', email: 'jordan2@example.com', password });

    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'jordan2@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.text).toContain('status-icon danger');
    expect(res.text).toContain(
      'The email or password you entered is incorrect. Access denied.'
    );
    expect(res.text).toContain('Try Again');
  });

  it('denies access for an email that does not exist', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'nobody@example.com', password: 'whatever123' });

    expect(res.status).toBe(401);
    expect(res.text).toContain('status-icon danger');
    expect(res.text).toContain(
      'The email or password you entered is incorrect. Access denied.'
    );
  });
});
