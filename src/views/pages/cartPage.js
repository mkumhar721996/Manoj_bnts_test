const { renderSiteLayout } = require('../siteLayout');
const { renderSiteHeader } = require('../components/siteHeader');
const cartStore = require('../../store/cartStore');

function renderCartPage() {
  const header = renderSiteHeader({
    activePath: '/cart',
    cartCount: cartStore.getCount(),
    etaLabel: 'Estimated delivery:',
    etaValue: '30 mins',
  });

  const body = `
${header}
<main>
  <h1>Your Cart</h1>
</main>
`;

  return renderSiteLayout('Your Cart — Forno Rosso', body);
}

module.exports = { renderCartPage };
