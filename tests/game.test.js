const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const emailService = require('../src/services/emailService');

const generateValidPassword = () => `longenough${crypto.randomBytes(4).toString('hex')}`;

async function loginNewPlayer() {
  const pwd = generateValidPassword();
  const email = `player-${crypto.randomBytes(4).toString('hex')}@example.com`;
  await request(app)
    .post('/register')
    .type('form')
    .send({ name: 'Jordan Rivera', email, password: pwd });
  return request(app).post('/login').type('form').send({ email, password: pwd });
}

beforeEach(() => {
  userStore.reset();
  emailService.reset();
});

describe('AC1: feed page shows a visible link to the game', () => {
  it('renders a visible play-game link on the feed page', async () => {
    const res = await loginNewPlayer();

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/id="play-game-link"[^>]*href="\/game"/);
    expect(res.text).toContain('Play the Slot Machine');
  });
});

describe('AC2: clicking the game link navigates to GET /game', () => {
  it('follows the play-game link href to a working GET /game route', async () => {
    const feedRes = await loginNewPlayer();

    const hrefMatch = feedRes.text.match(/id="play-game-link"[^>]*href="([^"]+)"/);
    expect(hrefMatch[1]).toBe('/game');

    const gameRes = await request(app).get(hrefMatch[1]);
    expect(gameRes.status).toBe(200);
  });
});

describe('AC3: GET /game renders the slot-machine page', () => {
  it('renders the slot machine page', async () => {
    const res = await request(app).get('/game');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('id="slot-machine-page"');
    expect(res.text).toContain('Slot Machine');
  });
});

describe('AC4: successful login lands on the feed page, not the game page', () => {
  it('renders the feed page shell and not the slot machine page', async () => {
    const res = await loginNewPlayer();

    expect(res.status).toBe(200);
    expect(res.text).toContain('class="app-shell"');
    expect(res.text).not.toContain('id="slot-machine-page"');
  });
});
