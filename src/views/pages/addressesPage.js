const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderAddressesPage({ addresses = [] } = {}) {
  const list =
    addresses.length === 0
      ? '<p id="empty-addresses">No saved addresses yet</p>'
      : `<ul id="address-list">${addresses
          .map(
            (address) => `
      <li class="post">
        <div>
          <div class="post-author">${escapeHtml(address.streetAddress)}</div>
          ${address.aptSuite ? `<p>${escapeHtml(address.aptSuite)}</p>` : ''}
          ${address.deliveryInstructions ? `<p>${escapeHtml(address.deliveryInstructions)}</p>` : ''}
          <div>
            <a id="delete-address-${escapeHtml(address.id)}" href="/addresses/${escapeHtml(address.id)}/delete-confirm">Delete</a>
          </div>
        </div>
      </li>`
          )
          .join('')}</ul>`;

  const body = `
<div class="status-screen">
  <div class="card">
    <h2>Saved Addresses</h2>
    ${list}
  </div>
</div>
`;

  return renderLayout('Saved Addresses', body);
}

module.exports = { renderAddressesPage };
