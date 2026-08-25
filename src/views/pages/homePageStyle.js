const HOME_PAGE_STYLE = `
:root {
  --bg: #FCFAF6;
  --surface: #FFFFFF;
  --surface-alt: #F3EFE9;
  --border: #EBE7DF;
  --border-dark: #FFFFFF;
  --fg: #151212;
  --muted: #6B6661;
  --brand: #C82D25;
  --brand-success: #2A7043;
  --white: #FFFFFF;

  --font-display: 'Fraunces', serif;
  --font-body: 'Geist', -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;

  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-8: 48px;
  --space-10: 80px;

  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-pill: 100px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
}

h1, h2, h3, p { margin: 0; }

button { font-family: var(--font-body); cursor: pointer; }
a { color: inherit; text-decoration: none; }

.site-header {
  background: var(--fg);
  color: var(--white);
  padding: var(--space-4) var(--space-10);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  flex-wrap: wrap;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.brand-logo__mark {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--brand);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 20px;
}
.brand-logo__word {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 20px;
  color: var(--white);
}

.nav-bar {
  display: flex;
  gap: var(--space-6);
  align-items: center;
  flex-wrap: wrap;
}
.nav-link {
  color: var(--white);
  font-size: 15px;
  padding-bottom: 4px;
  border-bottom: 2px solid transparent;
}
.nav-link.is-active {
  color: var(--brand);
  border-bottom-color: var(--brand);
}

.header-cart-status {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  flex-wrap: wrap;
}
.header-cart-status__eta {
  font-size: 14px;
  color: var(--white);
}
.header-cart-status__eta strong {
  color: var(--brand-success);
  font-weight: 600;
}

.cart-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: rgba(255, 255, 255, 0.14);
  color: var(--white);
  border: none;
  border-radius: var(--radius-pill);
  padding: var(--space-2) var(--space-4);
  font-size: 14px;
  font-weight: 600;
}

.popular-pizzas-section {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-10) var(--space-10);
}

.section-heading {
  text-align: center;
  margin-bottom: var(--space-8);
}
.section-heading__eyebrow {
  display: block;
  color: var(--brand);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-3);
}
.section-heading__title {
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 600;
  color: var(--fg);
}
.section-heading__accent {
  width: 64px;
  height: 3px;
  background: var(--brand);
  margin: var(--space-4) auto 0;
}

.pizza-card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-5);
}

.pizza-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.pizza-card__image {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}
.pizza-card__body {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 1;
}
.pizza-card__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-3);
}
.pizza-card__name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
}
.pizza-card__price {
  color: var(--brand);
  font-weight: 700;
  font-size: 16px;
  white-space: nowrap;
}
.pizza-card__description {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.4;
  flex: 1;
}

.add-to-order-btn {
  width: 100%;
  background: var(--fg);
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.menu-state-message {
  text-align: center;
  color: var(--muted);
  font-size: 16px;
  padding: var(--space-8) 0;
}
.menu-state-message.is-error {
  color: var(--brand);
}

#toastContainer {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  z-index: 1000;
}
.toast {
  background: var(--fg);
  color: var(--white);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-sm);
  font-size: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

@media (max-width: 640px) {
  .site-header {
    padding: var(--space-4) var(--space-5);
    flex-direction: column;
    align-items: flex-start;
  }
  .nav-bar {
    flex-wrap: wrap;
    gap: var(--space-4);
  }
  .popular-pizzas-section {
    padding: var(--space-8) var(--space-4);
  }
  .section-heading__title {
    font-size: 28px;
  }
  .pizza-card-grid {
    grid-template-columns: 1fr;
  }
}
`;

module.exports = { HOME_PAGE_STYLE };
