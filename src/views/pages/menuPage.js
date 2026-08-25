const { renderSiteLayout } = require('../siteLayout');
const { renderSiteHeader } = require('../components/siteHeader');
const cartStore = require('../../store/cartStore');

function renderMenuPage(cartId) {
  const header = renderSiteHeader({
    activePath: '/menu',
    cartCount: cartStore.getCount(cartId),
    etaLabel: 'Estimated delivery:',
    etaValue: '30 mins',
  });

  const body = `
${header}
<main>
  <h1>Our Menu</h1>
</main>
`;

  return renderSiteLayout('Our Menu — Forno Rosso', body);
}

module.exports = { renderMenuPage };
