const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderCheckoutPage({ streetAddress, aptSuite, deliveryInstructions }) {
  const body = `
<div class="status-screen">
  <div class="card">
    <h2>Checkout</h2>
    <p>Delivering to: <strong>${escapeHtml(streetAddress)}</strong>${aptSuite ? `, ${escapeHtml(aptSuite)}` : ''}</p>
    ${deliveryInstructions ? `<p>Instructions: ${escapeHtml(deliveryInstructions)}</p>` : ''}
  </div>
</div>
`;

  return renderLayout('Checkout', body);
}

module.exports = { renderCheckoutPage };
