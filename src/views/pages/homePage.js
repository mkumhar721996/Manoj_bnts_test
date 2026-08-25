const { renderSiteLayout } = require('../siteLayout');
const { renderSiteHeader } = require('../components/siteHeader');
const cartStore = require('../../store/cartStore');

function renderHomePage(cartId) {
  const header = renderSiteHeader({
    activePath: '/',
    cartCount: cartStore.getCount(cartId),
    etaLabel: 'Estimated delivery:',
    etaValue: '30 mins',
  });

  const body = `
${header}
<main>
  <h1>Forno Rosso</h1>
</main>
`;

  return renderSiteLayout('Forno Rosso', body);
}

module.exports = { renderHomePage };
