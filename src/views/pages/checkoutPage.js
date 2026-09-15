const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

const ADDRESS_FIELDS = [
  'recipientName',
  'streetAddress',
  'aptSuite',
  'floor',
  'city',
  'state',
  'postalCode',
  'country',
  'deliveryInstructions',
];

function renderCheckoutPage({
  recipientName,
  streetAddress,
  aptSuite,
  floor,
  city,
  state,
  postalCode,
  country,
  deliveryInstructions,
  addressSaveOffer = false,
  addressSaveNotice,
} = {}) {
  const address = {
    recipientName,
    streetAddress,
    aptSuite,
    floor,
    city,
    state,
    postalCode,
    country,
    deliveryInstructions,
  };

  const addressSaveOfferMarkup = addressSaveOffer
    ? `
<form class="card" action="/checkout/save-address" method="post">
  ${ADDRESS_FIELDS.map(
    (field) => `<input type="hidden" name="${field}" value="${escapeHtml(address[field] || '')}">`
  ).join('')}
  <button class="btn btn-brand btn-block" type="submit">Save this address to my account</button>
</form>`
    : '';

  const addressSaveNoticeMarkup = addressSaveNotice
    ? `<div class="alert ${addressSaveNotice.type === 'success' ? 'alert-success' : 'alert-danger'}">${escapeHtml(
        addressSaveNotice.message
      )}</div>`
    : '';

  const body = `
<div class="status-screen">
  <div class="card">
    <h2>Checkout</h2>
    ${addressSaveNoticeMarkup}
    <p>Delivering to: <strong>${escapeHtml(streetAddress)}</strong>${aptSuite ? `, ${escapeHtml(aptSuite)}` : ''}${floor ? `, Floor ${escapeHtml(floor)}` : ''}</p>
    ${city ? `<p>${escapeHtml(city)}${state ? `, ${escapeHtml(state)}` : ''}${postalCode ? ` ${escapeHtml(postalCode)}` : ''}</p>` : ''}
    ${deliveryInstructions ? `<p>Instructions: ${escapeHtml(deliveryInstructions)}</p>` : ''}
  </div>
  ${addressSaveOfferMarkup}
</div>
`;

  return renderLayout('Checkout', body);
}

module.exports = { renderCheckoutPage };
