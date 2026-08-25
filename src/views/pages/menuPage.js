const { renderLayout } = require('../layout');

function renderMenuPage() {
  const body = `
<div class="status-screen">
  <h1>Our Menu</h1>
  <p>Full menu coming soon.</p>
  <a class="back-link" href="/">Back to home</a>
</div>
`;

  return renderLayout('Forno Rosso — Menu', body);
}

module.exports = { renderMenuPage };
