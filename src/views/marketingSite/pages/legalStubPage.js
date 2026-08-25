const { renderMarketingLayout } = require('../layout');

function renderLegalStubPage(title) {
  const body = `
<main class="legal-stub">
  <h1>${title}</h1>
  <p>This page is a placeholder.</p>
</main>
`;

  return renderMarketingLayout(title, body);
}

module.exports = { renderLegalStubPage };
