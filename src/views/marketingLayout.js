const STYLE = `
:root {
  --ink: #151212;
  --brand-red: #C82D25;
  --brand-green: #2A7043;
  --muted-on-light: #6B6661;
  --surface-cream: #FCFAF6;
  --surface-warm: #F3EFE9;
  --white: #FFFFFF;

  --border-card: #EBE7DF;
  --border-accent: #C82D25;
  --border-white: #FFFFFF;

  --muted-on-dark: rgba(255,255,255,0.6);
  --chip-fill-faint: rgba(255,255,255,0.07);
  --chip-fill-soft: rgba(255,255,255,0.10);
  --chip-fill-medium: rgba(255,255,255,0.125);

  --font-display: 'Fraunces', serif;
  --font-body: 'Geist', ui-sans-serif, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;

  --radius-xs: 1px;
  --radius-sm: 1.5px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-lg-alt: 18px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-full: 100px;

  --space-2: 2px;
  --space-4: 4px;
  --space-6: 6px;
  --space-8: 8px;
  --space-10: 10px;
  --space-12: 12px;
  --space-16: 16px;
  --space-20: 20px;
  --space-24: 24px;
  --space-32: 32px;
  --space-40: 40px;
  --space-48: 48px;
  --space-64: 64px;
  --space-80: 80px;
  --space-96: 96px;
  --space-120: 120px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--surface-cream);
  color: var(--ink);
  font-family: var(--font-body);
}

h1, h2, h3, p { margin: 0; }

a { color: inherit; text-decoration: none; }

button { font-family: var(--font-body); cursor: pointer; }

img { display: block; max-width: 100%; }

.eyebrow-label {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 13px;
  line-height: 16.9px;
  text-transform: uppercase;
}

.eyebrow-label-alt {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  line-height: 18.2px;
  text-transform: uppercase;
}

.nav-link {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 15px;
  line-height: 19.5px;
}

.nav-link-active {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 15px;
  line-height: 19.5px;
}

.body-text {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 14px;
  line-height: 19.6px;
}

.body-lg-text {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 18px;
  line-height: 27px;
}

.button-label {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 16px;
  line-height: 20.8px;
}

.price-text {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 18px;
  line-height: 23.4px;
}

.card-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 20px;
  line-height: 24.66px;
}

.wordmark {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 24px;
  line-height: 29.59px;
}

.feature-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  line-height: 22.19px;
}

.section-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 40px;
  line-height: 49.32px;
}

.hero-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 64px;
  line-height: 70.4px;
}

/* Site header */
.site-header {
  background: var(--ink);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-24) var(--space-80);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.logo-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-xl);
  background: var(--brand-red);
  color: var(--white);
  font-family: var(--font-display);
  font-weight: 600;
}

.logo-badge--sm {
  width: 36px;
  height: 36px;
}

.logo-wordmark {
  color: var(--white);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-32);
}

.nav-links a {
  color: var(--white);
  position: relative;
  padding-bottom: var(--space-8);
}

.nav-links a.is-active {
  color: var(--brand-red);
}

.nav-links a.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--brand-red);
}

.header-cart {
  display: flex;
  align-items: center;
  gap: var(--space-20);
}

.header-cart__eta {
  color: var(--white);
  font-family: var(--font-body);
  font-size: 14px;
}

.header-cart__eta strong {
  color: var(--brand-green);
  font-weight: 600;
}

.cart-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-8);
  background: var(--chip-fill-soft);
  color: var(--white);
  border: none;
  border-radius: var(--radius-2xl);
  padding: var(--space-10) var(--space-16);
}

#cart-panel {
  position: absolute;
  top: 72px;
  right: 80px;
  width: 320px;
  background: var(--white);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-md);
  padding: var(--space-16);
  display: none;
  z-index: 10;
}

#cart-panel.is-open { display: block; }

#cart-line-items {
  list-style: none;
  margin: 0;
  padding: 0;
}

#cart-line-items li {
  display: flex;
  justify-content: space-between;
  padding: var(--space-8) 0;
  border-bottom: 1px solid var(--border-card);
  font-size: 14px;
}

#cart-empty-message {
  color: var(--muted-on-light);
  font-size: 14px;
}

/* Hero */
.hero {
  background: var(--ink);
  display: flex;
  gap: var(--space-48);
  padding: var(--space-80);
  align-items: center;
}

.hero-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.eyebrow-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  background: var(--chip-fill-faint);
  color: var(--white);
  border-radius: var(--radius-full);
  padding: var(--space-8) var(--space-16);
  width: fit-content;
}

.hero-title .accent {
  color: var(--brand-red);
  display: block;
}

.hero-title .lead {
  color: var(--white);
  display: block;
}

.hero-description {
  color: var(--muted-on-dark);
}

.hero-ctas {
  display: flex;
  gap: var(--space-16);
}

.hero-image-wrapper {
  flex: 1;
}

.hero-image-wrapper img {
  width: 100%;
  height: 480px;
  object-fit: cover;
  border-radius: var(--radius-2xl);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  border-radius: var(--radius-md);
  padding: var(--space-16) var(--space-32);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 16px;
  line-height: 20.8px;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--brand-red);
  color: var(--white);
}

.btn-outline {
  background: transparent;
  color: var(--white);
  border: 1px solid var(--white);
}

.btn-dark {
  background: var(--ink);
  color: var(--white);
  width: 100%;
}

/* Delivery banner */
.delivery-banner {
  background: var(--brand-green);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-24) var(--space-80);
}

.delivery-banner__promise {
  display: flex;
  align-items: center;
  gap: var(--space-16);
}

.icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--chip-fill-medium);
  flex-shrink: 0;
}

.delivery-banner__text h3 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
}

.delivery-banner__text p {
  font-size: 14px;
  color: var(--muted-on-dark);
}

.stats-row {
  display: flex;
  gap: var(--space-64);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.stat-item__label {
  text-transform: uppercase;
  font-size: 12px;
  color: var(--muted-on-dark);
}

.stat-item--right .stat-item__label {
  text-align: right;
}

.stat-item__value {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 20px;
}

/* Featured section */
.featured-section {
  padding: var(--space-96) var(--space-80);
  display: flex;
  flex-direction: column;
  gap: var(--space-48);
}

.section-heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.section-heading--center {
  align-items: center;
  text-align: center;
}

.section-heading--left {
  align-items: flex-start;
  text-align: left;
}

.section-heading__eyebrow {
  color: var(--brand-red);
}

.section-heading__eyebrow--green {
  color: var(--brand-green);
}

.section-heading__rule {
  width: 64px;
  height: 2px;
  background: var(--brand-red);
}

.featured-grid {
  display: flex;
  gap: var(--space-24);
}

.pizza-card {
  flex: 1;
  background: var(--white);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pizza-card img {
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.pizza-card__body {
  padding: var(--space-24);
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  flex: 1;
}

.pizza-card__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-8);
}

.pizza-card__price {
  color: var(--brand-red);
}

.pizza-card__description {
  color: var(--muted-on-light);
  font-size: 14px;
  min-height: 60px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Story section */
.story-section {
  background: var(--surface-warm);
  display: flex;
  gap: var(--space-48);
  padding: var(--space-96) var(--space-80);
  align-items: center;
}

.story-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.story-description {
  color: var(--muted-on-light);
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.feature-item {
  display: flex;
  gap: var(--space-16);
  align-items: flex-start;
}

.feature-item__icon {
  width: 36px;
  height: 36px;
  background: var(--brand-red);
  color: var(--white);
}

.feature-item__description {
  color: var(--muted-on-light);
  font-size: 14px;
}

.story-image-collage {
  flex: 1;
  display: flex;
  gap: var(--space-16);
}

.story-image-collage img {
  flex: 1;
  height: 520px;
  object-fit: cover;
  border-radius: var(--radius-lg);
}
`;

function renderMarketingLayout(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&display=swap" rel="stylesheet">
<style>${STYLE}</style>
</head>
<body>
${bodyHtml}
<script src="/js/cart.js" defer></script>
</body>
</html>
`;
}

module.exports = { renderMarketingLayout };
