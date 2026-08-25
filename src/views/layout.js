const STYLE = `
:root {
  --bg: #f0f2f5;
  --surface: #ffffff;
  --border: #dadde1;
  --fg: #1c1e21;
  --muted: #65676b;
  --brand: #1877f2;
  --brand-dark: #145dbf;
  --brand-tint: #e7f0fd;
  --brand-contrast: #ffffff;
  --success: #31a24c;
  --success-dark: #279140;
  --success-tint: #e6f4ea;
  --danger: #d0342c;
  --danger-tint: #fde2e1;
  --focus-ring: #8bb8fb;

  --font-sans: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-md: 17px;
  --font-size-lg: 22px;
  --font-size-xl: 32px;
  --font-size-xxl: 46px;
  --line-height-tight: 1.2;
  --line-height-base: 1.45;
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 14px;
  --radius-pill: 999px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.14);
  --shadow-md: 0 6px 18px rgba(0, 0, 0, 0.16);

  --transition-fast: 120ms ease;
  --transition-base: 220ms ease;

  --max-content-width: 980px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

h1, h2, h3, p { margin: 0; }

button { font-family: var(--font-sans); cursor: pointer; }

a { color: var(--brand); text-decoration: none; }
a:hover { text-decoration: underline; }

.site-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: var(--space-3) var(--space-5);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-wordmark {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--brand);
  letter-spacing: -0.5px;
}

.header-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.btn {
  border-radius: var(--radius-sm);
  border: none;
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  transition: background var(--transition-fast), opacity var(--transition-fast);
}
.btn-brand { background: var(--brand); color: var(--brand-contrast); }
.btn-brand:hover { background: var(--brand-dark); }
.btn-success { background: var(--success); color: var(--brand-contrast); }
.btn-success:hover { background: var(--success-dark); }
.btn-ghost { background: transparent; color: var(--brand); border: 1px solid var(--border); }
.btn-ghost:hover { background: var(--brand-tint); }
.btn:disabled { opacity: 0.6; cursor: default; }
.btn-block { width: 100%; }

.hero {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: var(--space-7) var(--space-4);
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: var(--space-8);
  align-items: start;
}
@media (max-width: 860px) {
  .hero { grid-template-columns: 1fr; padding: var(--space-5) var(--space-3); gap: var(--space-6); }
}

.hero-copy .brand-wordmark { font-size: var(--font-size-xxl); margin-bottom: var(--space-3); display: block; }
.hero-copy p {
  font-size: var(--font-size-md);
  color: var(--fg);
  max-width: 420px;
  line-height: var(--line-height-base);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
}

.card + .card { margin-top: var(--space-4); }

.card h2 {
  font-size: var(--font-size-md);
  margin-bottom: var(--space-4);
}

.field { margin-bottom: var(--space-3); }
.field label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-1);
  color: var(--muted);
}
.field input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-base);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  color: var(--fg);
  background: var(--surface);
}
.field input:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
  border-color: var(--brand);
}
.field.has-error input { border-color: var(--danger); background: var(--danger-tint); }
.field-error {
  color: var(--danger);
  font-size: var(--font-size-xs);
  margin-top: var(--space-1);
}

.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: var(--space-4) 0;
}

.helper-text {
  font-size: var(--font-size-xs);
  color: var(--muted);
  margin-top: var(--space-2);
  text-align: center;
}

.alert {
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
}
.alert-danger { background: var(--danger-tint); color: var(--danger); border: 1px solid var(--danger); }
.alert-success { background: var(--success-tint); color: var(--success-dark); border: 1px solid var(--success); }
.alert ul { margin: var(--space-1) 0 0; padding-left: var(--space-5); }

.status-screen {
  max-width: 480px;
  margin: var(--space-8) auto;
  padding: 0 var(--space-4);
  text-align: center;
}
.status-screen .card { text-align: left; }
.status-icon {
  width: 56px; height: 56px;
  border-radius: var(--radius-pill);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto var(--space-4);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--brand-contrast);
}
.status-icon.success { background: var(--success); }
.status-icon.danger { background: var(--danger); }

.app-shell {
  display: grid;
  grid-template-columns: 220px 1fr 260px;
  gap: var(--space-4);
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-4);
}
@media (max-width: 900px) {
  .app-shell { grid-template-columns: 1fr; }
}
.side-nav { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-3); }
.side-nav__item {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-2);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin-bottom: var(--space-1);
}
.side-nav__item.is-current { background: var(--brand-tint); color: var(--brand-dark); }
.avatar {
  width: 36px; height: 36px;
  border-radius: var(--radius-pill);
  background: var(--brand);
  color: var(--brand-contrast);
  display: flex; align-items: center; justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}
.welcome-banner {
  background: var(--brand);
  color: var(--brand-contrast);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-4);
}
.welcome-banner h1 { font-size: var(--font-size-lg); margin-bottom: var(--space-1); }
.welcome-banner p { opacity: 0.9; font-size: var(--font-size-sm); }
.post {
  display: flex; gap: var(--space-3);
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-3);
  border-bottom: 1px solid var(--border);
}
.post:last-child { border-bottom: none; margin-bottom: 0; }
.post-author { font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm); }
.post-meta { color: var(--muted); font-size: var(--font-size-xs); margin-bottom: var(--space-2); }
.right-rail { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-3); font-size: var(--font-size-sm); }
.right-rail h3 { font-size: var(--font-size-sm); color: var(--muted); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: 0.4px; }
.contact { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }

.back-link { display: inline-block; margin-top: var(--space-4); font-size: var(--font-size-sm); }

/* Cart page (Forno Rosso) — separate token set, scoped under .cart-page so it
   coexists with the Facebook-style tokens/classes above without collisions. */
.cart-page {
  --cart-bg: #FCFAF6;
  --cart-surface: #FFFFFF;
  --cart-surface-muted: #FCFAF6;
  --cart-ink: #151212;
  --cart-ink-inverse: #FFFFFF;
  --cart-muted: #6B6661;
  --cart-border: #EBE7DF;
  --cart-brand: #C82D25;
  --cart-success: #2A7043;
  --cart-radius-md: 8px;
  --cart-radius-xl: 16px;
  --font-display: Fraunces, serif;
  --font-cart-body: Geist, sans-serif;

  background: var(--cart-bg);
  color: var(--cart-ink);
  font-family: var(--font-cart-body);
}

.cart-site-header {
  background: var(--cart-ink);
  color: var(--cart-ink-inverse);
  padding: 20px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cart-brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
}
.cart-brand-mark .cart-brand-logo {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--cart-brand);
  color: var(--cart-ink-inverse);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
}
.cart-nav { display: flex; gap: 24px; align-items: center; }
.cart-nav a { color: var(--cart-ink-inverse); font-size: 15px; font-weight: 500; }
.cart-nav a:hover { color: var(--cart-brand); text-decoration: none; }
.cart-nav a.is-active {
  color: var(--cart-brand);
  font-weight: 600;
  border-bottom: 2px solid var(--cart-brand);
  padding-bottom: 4px;
}
.cart-header-actions { display: flex; align-items: center; gap: 16px; font-size: 14px; }
.cart-eta .cart-eta-value { color: var(--cart-success); font-weight: 600; }
.cart-header-cart-badge {
  position: relative;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
}
.cart-header-cart-badge .cart-badge-count {
  position: absolute;
  top: -4px; right: -4px;
  background: var(--cart-brand);
  color: var(--cart-ink-inverse);
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  min-width: 18px;
  height: 18px;
  display: flex; align-items: center; justify-content: center;
}

.cart-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px;
  display: grid;
  grid-template-columns: 1.65fr 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 960px) {
  .cart-body { grid-template-columns: 1fr; }
}
.cart-left { display: flex; flex-direction: column; gap: 24px; }

.cart-card {
  background: var(--cart-surface);
  border: 1px solid var(--cart-border);
  border-radius: var(--cart-radius-xl);
  padding: 24px;
}
.cart-card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}
.cart-card-header h2 {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
}
.cart-card-header .cart-card-meta { color: var(--cart-muted); font-size: 14px; }

.cart-item-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--cart-border);
}
.cart-item-row:last-child { border-bottom: none; padding-bottom: 0; }
.cart-item-row:first-child { padding-top: 0; }
.cart-item-thumb { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; flex-shrink: 0; }
.cart-item-info { flex: 1; }
.cart-item-name { font-weight: 600; font-size: 14px; }
.cart-item-variant { color: var(--cart-muted); font-size: 13px; }
.cart-item-qty {
  display: flex; align-items: center; gap: 8px;
  background: var(--cart-surface-muted);
  border-radius: var(--cart-radius-md);
  padding: 4px;
}
.cart-item-qty button {
  width: 24px; height: 24px;
  border: none;
  border-radius: 6px;
  background: var(--cart-surface);
  font-weight: 600;
}
.cart-item-price { width: 90px; text-align: right; font-weight: 700; font-size: 14px; }
.cart-item-remove {
  color: var(--cart-brand);
  font-size: 13px;
  font-weight: 600;
  background: none;
  border: none;
  display: flex; align-items: center; gap: 4px;
}

.cart-section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}
.cart-section-heading h2 {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
}
.cart-eta-badge { color: var(--cart-success); font-size: 13px; font-weight: 600; }

.cart-field { margin-bottom: 16px; }
.cart-field label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.cart-field input, .cart-field textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  font-family: var(--font-cart-body);
  background: var(--cart-surface-muted);
  border: 1px solid var(--cart-border);
  border-radius: var(--cart-radius-md);
  color: var(--cart-ink);
}
.cart-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 6px 0;
}
.summary-line-value { font-weight: 600; }
.summary-line-value.is-success { color: var(--cart-success); }
.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 12px 0 20px;
  padding-top: 16px;
  border-top: 1px solid var(--cart-border);
}
.summary-total-label { font-family: var(--font-display); font-size: 16px; font-weight: 600; }
.summary-total-value { color: var(--cart-brand); font-size: 22px; font-weight: 700; }

.promo-code-field { margin-bottom: 20px; }
.promo-code-field > label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.promo-code-form, .promo-code-row { display: flex; gap: 10px; }
.promo-input-wrap { position: relative; flex: 1; display: flex; align-items: center; }
.promo-input {
  flex: 1;
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  font-family: var(--font-cart-body);
  border-radius: var(--cart-radius-md);
  border: 1px solid var(--cart-border);
  background: var(--cart-surface-muted);
  color: var(--cart-ink);
}
.promo-input--applied {
  border-color: var(--cart-success);
  color: var(--cart-success);
  font-weight: 600;
  background: var(--cart-surface);
  padding-right: 36px;
}
.promo-input--error { border-color: var(--cart-brand); }
.promo-check-icon {
  position: absolute;
  right: 12px;
  color: var(--cart-success);
}
.promo-btn {
  border-radius: var(--cart-radius-md);
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--cart-border);
  background: var(--cart-surface);
  color: var(--cart-ink);
  white-space: nowrap;
}
.promo-btn-applied { background: var(--cart-success); border-color: var(--cart-success); color: var(--cart-ink-inverse); }
.cart-field-error { color: var(--cart-brand); font-size: 13px; margin-top: 6px; }

.cart-checkout-btn {
  width: 100%;
  background: var(--cart-brand);
  color: var(--cart-ink-inverse);
  border: none;
  border-radius: 12px;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
`;

function renderLayout(title, bodyHtml) {
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
</body>
</html>
`;
}

module.exports = { renderLayout };
