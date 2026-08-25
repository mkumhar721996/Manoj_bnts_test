const { renderLayout } = require('./layout');

const STYLE = `
:root {
  --brand-green: #2A7043;
  --color-white: #FFFFFF;

  --font-display: 'Fraunces', serif;
  --font-body: 'Geist', sans-serif;

  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-20: 80px;

  --radius-full: 100px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  font-family: var(--font-body);
}

.delivery-banner {
  background: var(--brand-green);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6) var(--space-20);
  gap: var(--space-8);
}

.delivery-highlight {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.icon-badge {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.125);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
}

.delivery-highlight-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.delivery-highlight-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-white);
  margin: 0;
}

.delivery-highlight-subtitle {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.stat-group {
  display: flex;
  gap: var(--space-8);
}

.stat-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-block--eta {
  align-items: flex-end;
}

.stat-label {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  margin: 0;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-white);
  margin: 0;
}

@media (max-width: 640px) {
  .delivery-banner {
    flex-direction: column;
    align-items: flex-start;
    padding: var(--space-6) var(--space-4);
    gap: var(--space-6);
  }

  .stat-group {
    flex-wrap: wrap;
    width: 100%;
    justify-content: space-between;
  }

  .stat-block--eta {
    align-items: flex-start;
  }
}
`;

function renderFornoRossoLayout(title, bodyHtml) {
  return renderLayout(title, bodyHtml, STYLE);
}

module.exports = { renderFornoRossoLayout };
