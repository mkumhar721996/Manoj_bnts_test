const request = require('supertest');
const app = require('../src/app');

describe('AC1: delivery promise banner shows threshold, ETA range, and hot-guarantee', () => {
  it('renders all three promises on the home page', async () => {
    const res = await request(app).get('/forno-rosso');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Free Delivery On Orders Over $35');
    expect(res.text).toContain('25 - 35 Min');
    expect(res.text).toContain('Piping Hot Guaranteed');
  });
});

describe('AC2: banner background matches the brand-green design token (#2A7043)', () => {
  it('paints the banner with --brand-green, defined as #2A7043', async () => {
    const res = await request(app).get('/forno-rosso');
    const style = res.text.match(/<style>([\s\S]*?)<\/style>/)[1];

    expect(style).toMatch(/--brand-green:\s*#2A7043\s*;/i);
    expect(res.text).toMatch(/<section[^>]*class="delivery-banner"/);
    const rule = style.match(/\.delivery-banner\s*{[^}]*}/)[0];
    expect(rule).toMatch(/background:\s*var\(--brand-green\)/);
  });
});

describe('AC3: banner content stays fully visible on mobile, no truncation or horizontal scroll', () => {
  it('has no truncating/overflow styles on the highlight text or the stat values', async () => {
    const res = await request(app).get('/forno-rosso');
    const style = res.text.match(/<style>([\s\S]*?)<\/style>/)[1];

    for (const cls of ['delivery-highlight-title', 'delivery-highlight-subtitle', 'stat-label', 'stat-value']) {
      const rule = style.match(new RegExp(`\\.${cls}\\s*{[^}]*}`))[0];
      expect(rule).not.toMatch(/text-overflow|white-space:\s*nowrap|overflow:\s*hidden/);
    }
  });

  it('stacks into a single column under a mobile breakpoint instead of overflowing', async () => {
    const res = await request(app).get('/forno-rosso');
    const style = res.text.match(/<style>([\s\S]*?)<\/style>/)[1];

    expect(style).toContain('@media (max-width: 640px)');
    const mobileCss = style.slice(style.indexOf('@media (max-width: 640px)'));
    expect(mobileCss).toMatch(/\.delivery-banner\s*{[^}]*flex-direction:\s*column/);
    expect(mobileCss).toMatch(/\.stat-group\s*{[^}]*flex-wrap:\s*wrap/);
  });
});
