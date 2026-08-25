const { renderMarketingLayout } = require('../marketingLayout');
const { renderSiteHeader } = require('../components/siteHeader');

function renderMenuPage() {
  const body = `
${renderSiteHeader({ active: 'menu' })}

<section class="featured-section">
  <div class="section-heading section-heading--center">
    <h1 class="section-title">Our Menu</h1>
  </div>
</section>
`;

  return renderMarketingLayout('Our Menu — Forno Rosso', body);
}

module.exports = { renderMenuPage };
