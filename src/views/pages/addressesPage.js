const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderAddressesPage({ addresses = [] } = {}) {
  const body = `
<div class="status-screen">
  <div class="card" id="saved-addresses">
    <h2>Saved Addresses</h2>
    ${
      addresses.length === 0
        ? '<p>You have no saved addresses yet.</p>'
        : `<ul>${addresses
            .map((address) => `<li>${escapeHtml(address.streetAddress || '')}</li>`)
            .join('')}</ul>`
    }
  </div>
</div>
`;

  return renderLayout('Saved Addresses', body);
}

module.exports = { renderAddressesPage };
