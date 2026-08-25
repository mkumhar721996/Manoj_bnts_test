const STYLE = `
:root {
  --ink: #151212;
  --surface: #ffffff;
  --page-bg: #FCFAF6;
  --muted: #6B6661;
  --success: #2A7043;
  --vivid: #C82D25;
  --hairline: #EBE7DF;
  --input-border: #F3EFE9;

  --font-display: "Fraunces", serif;
  --font-body: "Geist", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--page-bg);
  color: var(--ink);
  font-family: var(--font-body);
}

h1, h2, h3, p { margin: 0; }
button { font-family: var(--font-body); cursor: pointer; }

.cart-header {
  background: var(--ink);
  color: #ffffff;
  padding: 20px 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cart-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-logo-badge {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: var(--vivid);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
}

.cart-logo-wordmark {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 20px;
}

.cart-icon-button {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: #2a2626;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--vivid);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-body {
  display: flex;
  gap: 48px;
  padding: 80px;
  align-items: flex-start;
}

.cart-left {
  flex-grow: 1;
}

.cart-right {
  width: 360px;
  flex-shrink: 0;
}

.cart-card {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 16px;
  padding: 32px;
}

.cart-card + .cart-card {
  margin-top: 24px;
}

.cart-card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
}

.cart-card-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
}

.cart-card-meta {
  color: var(--muted);
  font-size: 14px;
}

.cart-line-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid var(--hairline);
}

.cart-line-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.cart-line-item-info {
  flex-grow: 1;
}

.cart-line-item-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
}

.cart-line-item-variant {
  color: var(--muted);
  font-size: 12px;
  margin-top: 4px;
}

.cart-line-item-unit-price {
  color: var(--muted);
  font-size: 13px;
  margin-top: 4px;
}

.cart-stepper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cart-stepper form {
  margin: 0;
}

.cart-stepper-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--input-border);
  background: #ffffff;
  color: var(--ink);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-stepper-btn:disabled {
  color: var(--muted);
  cursor: default;
}

.cart-stepper-value {
  min-width: 20px;
  text-align: center;
  font-weight: 600;
}

.cart-line-item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.cart-line-item-price {
  font-size: 18px;
  font-weight: 700;
}

.cart-remove-form {
  margin: 0;
}

.cart-remove-btn {
  border: none;
  background: transparent;
  color: var(--vivid);
  font-size: 13px;
  padding: 0;
}

.cart-empty {
  color: var(--muted);
  padding: 20px 0;
}

.cart-summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.cart-summary-row.success .cart-summary-value {
  color: var(--success);
}

.cart-summary-total {
  display: flex;
  justify-content: space-between;
  padding-top: 16px;
  margin-top: 8px;
  border-top: 1px solid var(--hairline);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
}

.cart-summary-total .cart-summary-value {
  color: var(--vivid);
}
`;

function renderCartLayout(title, bodyHtml) {
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

module.exports = { renderCartLayout };
