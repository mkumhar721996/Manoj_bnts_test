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

.hero-section {
  --hero-bg: #151212;
  --hero-fg: #ffffff;
  --hero-muted: rgba(255, 255, 255, 0.8);
  --hero-brand: #C82D25;
  --hero-badge-bg: rgba(255, 255, 255, 0.07);

  background: var(--hero-bg);
  display: flex;
  align-items: center;
  gap: 48px;
  padding: 0 80px;
  min-height: 620px;
}

.hero-text-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
  flex: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  background: var(--hero-badge-bg);
  border-radius: 100px;
  padding: 6px 12px;
  font-family: 'Geist', var(--font-sans);
  font-weight: 600;
  font-size: 13px;
  line-height: 16.9px;
  text-transform: uppercase;
  color: var(--hero-fg);
}

.hero-badge-icon { flex-shrink: 0; }

.hero-heading {
  font-family: 'Fraunces', serif;
  font-weight: 700;
  font-size: 64px;
  line-height: 70.4px;
  color: var(--hero-fg);
}

.hero-heading-highlight { color: var(--hero-brand); }

.hero-description {
  font-family: 'Geist', var(--font-sans);
  font-weight: 400;
  font-size: 18px;
  line-height: 27px;
  color: var(--hero-muted);
}

.hero-cta-group {
  display: flex;
  gap: 16px;
}

.btn-hero-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--hero-brand);
  color: var(--hero-fg);
  border-radius: 8px;
  padding: 16px 32px;
  font-family: 'Geist', var(--font-sans);
  font-weight: 600;
  font-size: 16px;
  line-height: 20.8px;
}
.btn-hero-primary:hover { text-decoration: none; opacity: 0.9; }

.btn-hero-secondary {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: 1px solid var(--hero-fg);
  color: var(--hero-fg);
  border-radius: 8px;
  padding: 16px 24px;
  font-family: 'Geist', var(--font-sans);
  font-weight: 600;
  font-size: 16px;
  line-height: 20.8px;
}
.btn-hero-secondary:hover { text-decoration: none; background: rgba(255, 255, 255, 0.07); }

.hero-image-wrapper {
  max-width: 100%;
  width: 616px;
  height: 480px;
  border-radius: 24px;
  overflow: hidden;
  flex-shrink: 0;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@media (max-width: 640px) {
  .hero-section {
    flex-direction: column;
    padding: var(--space-6) var(--space-4);
    gap: var(--space-6);
    min-height: 0;
  }
  .hero-heading {
    font-size: 40px;
    line-height: 1.1;
  }
  .hero-cta-group {
    flex-direction: column;
  }
  .hero-image-wrapper {
    width: 100%;
    height: auto;
    aspect-ratio: 616 / 480;
  }
}
`;

function renderLayout(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
<style>${STYLE}</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

module.exports = { renderLayout };
