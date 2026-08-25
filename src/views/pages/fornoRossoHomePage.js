const { renderFornoRossoLayout } = require('../fornoRossoLayout');
const { renderDeliveryPromiseBanner } = require('../components/deliveryPromiseBanner');

function renderFornoRossoHomePage() {
  return renderFornoRossoLayout('Forno Rosso', renderDeliveryPromiseBanner());
}

module.exports = { renderFornoRossoHomePage };
