const request = require('supertest');
const app = require('../src/app');
const businessInfo = require('../src/config/businessInfo');

describe('AC1: footer displays brand blurb, social links, kitchen hours, address, delivery contact, and legal links', () => {
  it('renders all required business information on the page', async () => {
    const res = await request(app).get('/pizzeria');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);

    expect(res.text).toContain(businessInfo.brand.blurb);

    businessInfo.socialLinks.forEach((social) => {
      expect(res.text).toContain(`social-icon-link--${social.id}`);
    });

    expect(res.text).toContain('Kitchen Hours');
    businessInfo.kitchenHours.forEach(({ label, value }) => {
      expect(res.text).toContain(label);
      expect(res.text).toContain(value);
    });

    expect(res.text).toContain('Pizzeria Location');
    expect(res.text).toContain(businessInfo.location.address);
    expect(res.text).toContain(`Delivery: ${businessInfo.location.deliveryPhone}`);
    expect(res.text).toContain(`Email: ${businessInfo.location.deliveryEmail}`);

    businessInfo.legalLinks.forEach(({ label }) => {
      expect(res.text).toContain(label);
    });
  });
});

describe('AC2: footer information matches the static configuration values', () => {
  it('renders brand name and mark from configuration', async () => {
    const res = await request(app).get('/pizzeria');

    expect(res.text).toContain(`>${businessInfo.brand.mark}<`);
    expect(res.text).toContain(businessInfo.brand.name);
  });

  it('renders every kitchen-hours row exactly as configured', async () => {
    const res = await request(app).get('/pizzeria');

    businessInfo.kitchenHours.forEach(({ label, value }) => {
      expect(res.text).toContain(`>${label}<`);
      expect(res.text).toContain(`>${value}<`);
    });
  });

  it('renders every legal link with its configured href', async () => {
    const res = await request(app).get('/pizzeria');

    businessInfo.legalLinks.forEach(({ label, href }) => {
      expect(res.text).toContain(`<a href="${href}">${label}</a>`);
    });
  });

  it('renders the copyright text exactly as configured', async () => {
    const res = await request(app).get('/pizzeria');

    expect(res.text).toContain(businessInfo.copyright);
  });
});

describe('AC3: clicking a social media link opens it in a new browser tab', () => {
  it('opens every social link in a new tab safely', async () => {
    const res = await request(app).get('/pizzeria');

    businessInfo.socialLinks.forEach((social) => {
      const anchorMatch = res.text.match(
        new RegExp(`<a[^>]*class="social-icon-link social-icon-link--${social.id}"[^>]*>`)
      );
      expect(anchorMatch).not.toBeNull();
      const anchorTag = anchorMatch[0];

      expect(anchorTag).toContain(`href="${social.href}"`);
      expect(anchorTag).toContain('target="_blank"');
      expect(anchorTag).toContain('rel="noopener noreferrer"');
    });
  });
});

describe('AC4: clicking a legal link navigates to the appropriate legal page', () => {
  it('links to a dedicated route for each legal link', () => {
    businessInfo.legalLinks.forEach(({ href }) => {
      expect(href).toMatch(/^\/pizzeria\//);
    });
  });

  it('serves a stub page at each legal link destination', async () => {
    for (const { label, href } of businessInfo.legalLinks) {
      const res = await request(app).get(href);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain(label);
      expect(res.text).toContain('This page is a placeholder.');
    }
  });
});

describe('AC5: footer is fully visible and legible on a mobile viewport without horizontal scroll', () => {
  it('emits a mobile breakpoint that stacks the footer columns and bottom bar', async () => {
    const res = await request(app).get('/pizzeria');

    expect(res.text).toMatch(/\*\s*\{\s*box-sizing:\s*border-box;\s*\}/);
    expect(res.text).toContain('.site-footer {');
    expect(res.text).not.toMatch(/\.site-footer\s*\{[^}]*width:\s*\d+px/);

    const mediaQueryMatch = res.text.match(/@media \(max-width: 680px\) \{[\s\S]*?\n\}/);
    expect(mediaQueryMatch).not.toBeNull();
    const mediaQueryBlock = mediaQueryMatch[0];

    expect(mediaQueryBlock).toMatch(/\.site-footer\s*\{[^}]*padding:/);
    expect(mediaQueryBlock).toMatch(/\.site-footer__top\s*\{[^}]*flex-direction:\s*column/);
    expect(mediaQueryBlock).toMatch(/\.site-footer__bottom\s*\{[^}]*flex-direction:\s*column/);
  });
});

describe('AC6: footer content is static configuration, requiring no admin or CMS interface', () => {
  it('freezes the business info configuration and its nested collections', () => {
    expect(Object.isFrozen(businessInfo)).toBe(true);
    expect(Object.isFrozen(businessInfo.brand)).toBe(true);
    expect(Object.isFrozen(businessInfo.socialLinks)).toBe(true);
    expect(Object.isFrozen(businessInfo.kitchenHours)).toBe(true);
    expect(Object.isFrozen(businessInfo.location)).toBe(true);
    expect(Object.isFrozen(businessInfo.legalLinks)).toBe(true);
  });

  it('renders byte-identical footer markup across repeated requests', async () => {
    const first = await request(app).get('/pizzeria');
    const second = await request(app).get('/pizzeria');

    expect(first.text).toEqual(second.text);
  });
});
