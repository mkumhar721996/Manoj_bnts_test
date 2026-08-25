const { renderMarketingLayout } = require('../layout');
const { renderSiteFooter } = require('../components/siteFooter');
const businessInfo = require('../../../config/businessInfo');

function renderHomePage() {
  const body = `
<main></main>
${renderSiteFooter()}
`;

  return renderMarketingLayout(businessInfo.brand.name, body);
}

module.exports = { renderHomePage };
