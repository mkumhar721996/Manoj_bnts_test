const STYLE = `
:root {
  --ink: #151212;
  --brand-red: #C82D25;
  --brand-green: #2A7043;
  --muted: #6B6661;
  --surface-page: #FCFAF6;
  --surface-warm: #F3EFE9;
  --surface-white: #FFFFFF;
  --border-card: #EBE7DF;

  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Geist', -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--surface-page);
  color: var(--ink);
  font-family: var(--font-body);
}

h1, h2, h3, p { margin: 0; }

a { color: inherit; text-decoration: none; }

.site-header {
  background: var(--ink);
  height: 88px;
  padding: 0 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo-badge {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: var(--brand-red);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-style: italic;
  font-size: 22px;
}

.brand-wordmark {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 24px;
  color: #fff;
}

.primary-nav {
  display: flex;
  align-items: center;
  gap: 40px;
}

.nav-link {
  position: relative;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  padding-bottom: 8px;
}

.nav-link.is-active {
  color: var(--brand-red);
  font-weight: 600;
}

.nav-link.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 12px;
  height: 2px;
  border-radius: 1px;
  background: var(--brand-red);
}

.header-cart-summary {
  display: flex;
  align-items: center;
  gap: 24px;
}

.delivery-eta {
  font-size: 14px;
}

.delivery-eta-label {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
}

.delivery-eta-value {
  color: var(--brand-green);
  font-weight: 600;
}

.cart-indicator-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.10);
  border-radius: 24px;
  padding: 10px 16px;
  color: #fff;
}

.cart-indicator-btn svg {
  width: 18px;
  height: 18px;
  stroke: #fff;
}

#cart-badge {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

#cart-badge[hidden] {
  display: none;
}
`;

function renderSiteLayout(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>${STYLE}</style>
</head>
<body>
${bodyHtml}
<script src="/js/cart-badge.js" defer></script>
</body>
</html>
`;
}

module.exports = { renderSiteLayout };
