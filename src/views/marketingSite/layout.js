const STYLE = `
:root {
  --ink: #151212;
  --brand-red: #C82D25;
  --brand-green: #2A7043;
  --muted: #6B6661;
  --surface-cream: #F3EFE9;
  --surface-page: #FCFAF6;
  --surface-white: #FFFFFF;
  --border-hairline: #EBE7DF;
  --on-dark: #FFFFFF;

  --font-display: 'Fraunces', serif;
  --font-body: 'Geist', sans-serif;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--surface-page);
  color: var(--ink);
  font-family: var(--font-body);
  line-height: 1.5;
}

a { color: inherit; text-decoration: none; }

.site-footer {
  width: 100%;
  background: var(--ink);
  color: var(--on-dark);
  padding: 80px 80px 48px;
}

.site-footer__top {
  display: flex;
  gap: 64px;
  flex-wrap: wrap;
}

.footer-brand {
  flex: 1 1 260px;
  min-width: 0;
}

.footer-brand__logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.footer-brand__badge {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: var(--brand-red);
  color: var(--on-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}

.footer-brand__wordmark {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  color: var(--on-dark);
}

.footer-brand__blurb {
  font-size: 14px;
  line-height: 21px;
  color: rgba(255, 255, 255, 0.6);
  max-width: 340px;
  margin: 0 0 24px;
}

.footer-social-row {
  display: flex;
  gap: 12px;
}

.social-icon-link {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-column {
  flex: 1 1 200px;
  min-width: 0;
}

.footer-column__heading {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 16px;
  text-transform: uppercase;
  margin: 0 0 20px;
  color: var(--on-dark);
}

.footer-info-row {
  margin-bottom: 16px;
}
.footer-info-row:last-child { margin-bottom: 0; }

.footer-info-row__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-dark);
}

.footer-info-row__value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.footer-location__address {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 16px;
}

.footer-location__contact p {
  font-size: 14px;
  color: var(--on-dark);
  margin: 0;
}

.site-footer__divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  margin: 48px 0 24px;
}

.site-footer__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.site-footer__copyright {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.footer-legal-links {
  display: flex;
  gap: 24px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.footer-legal-links a {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
.footer-legal-links a:hover { text-decoration: underline; }

@media (max-width: 680px) {
  .site-footer {
    padding: 32px 20px;
  }
  .site-footer__top {
    flex-direction: column;
    gap: 32px;
  }
  .site-footer__bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
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
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,700;1,700&family=Geist:wght@400;600&display=swap" rel="stylesheet">
<style>${STYLE}</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

module.exports = { renderMarketingLayout };
