const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

// Scoped token overrides only — the card/field/error/button visuals themselves
// are the shared .card/.field/.field-error/.btn classes from views/layout.js,
// reused as-is so this page doesn't fork its own copy of those components.
const CART_PAGE_STYLE = `
.cart-page {
  --fg: #151212;
  --brand: #C82D25;
  --brand-dark: #A82018;
  --success: #2A7043;
  --muted: #6B6661;
  --bg: #FCFAF6;
  --surface: #FFFFFF;
  --border: #EBE7DF;
  --danger: var(--brand);
  --danger-tint: #FBEAE8;
  --font-sans: Geist, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  --font-serif: Fraunces, serif;
  --radius-lg: 16px;
  --radius-sm: 8px;
  --space-5: 32px;

  background: var(--bg);
  padding: 48px 80px;
}

.cart-page .card {
  max-width: 792px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cart-page .delivery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cart-page .delivery-header__title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-page .delivery-header h2 {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 20px;
  line-height: 24.66px;
  margin: 0;
}

.cart-page .delivery-eta {
  font-weight: 600;
  font-size: 13px;
  line-height: 16.9px;
  color: var(--success);
}

.cart-page .field-row {
  display: flex;
  gap: var(--space-4);
}

.cart-page .field-row .field {
  margin-bottom: 0;
  flex: 1;
}

.cart-page .field-apt {
  flex: 0 0 200px;
}

.cart-page .field input,
.cart-page .field textarea {
  background: var(--bg);
}

.cart-page .field textarea {
  color: var(--muted);
}

.cart-page .field input[readonly] {
  color: var(--muted);
  cursor: not-allowed;
}

.cart-page .btn-block {
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cart-page .saved-addresses {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-page .saved-address-option {
  display: flex;
  align-items: center;
  gap: 8px;
}
`;

function renderCartPage({ errors = [], values = {}, savedAddresses = [], selectedAddressId } = {}) {
  const hasSavedAddresses = savedAddresses.length > 0;
  const selectedSavedAddress = hasSavedAddresses
    ? savedAddresses.find((address) => address.id === selectedAddressId)
    : undefined;
  const isSavedAddressSelected = Boolean(selectedSavedAddress);

  const recipientName = values.recipientName !== undefined ? values.recipientName : '';
  const streetAddress =
    values.streetAddress !== undefined ? values.streetAddress : '128 Pizzaiolo Boulevard';
  const aptSuite = values.aptSuite !== undefined ? values.aptSuite : 'Penthouse 4B';
  const floor = values.floor !== undefined ? values.floor : '';
  const city = values.city !== undefined ? values.city : '';
  const state = values.state !== undefined ? values.state : '';
  const postalCode = values.postalCode !== undefined ? values.postalCode : '';
  const country = values.country !== undefined ? values.country : '';
  const deliveryInstructions =
    values.deliveryInstructions !== undefined
      ? values.deliveryInstructions
      : 'Ring doorbell or leave at front lobby desk. Please keep thermal bag zipped until handover!';

  const streetAddressError = errors.includes('Street address is required.');
  const readonlyAttr = isSavedAddressSelected ? ' readonly' : '';

  const savedAddressesSection = hasSavedAddresses
    ? `
  <div class="card saved-addresses">
    <h2>Choose a delivery address</h2>
    ${savedAddresses
      .map(
        (address) => `
    <label class="saved-address-option">
      <input type="radio" name="addressId" value="${escapeHtml(address.id)}" ${
          selectedAddressId === address.id ? 'checked' : ''
        }>
      <span>${escapeHtml(address.streetAddress || '')}${address.city ? `, ${escapeHtml(address.city)}` : ''}</span>
    </label>`
      )
      .join('')}
    <label class="saved-address-option">
      <input type="radio" name="addressId" value="new" ${selectedAddressId === 'new' ? 'checked' : ''}>
      <span>Enter a new address</span>
    </label>
  </div>
  <script>
    (function () {
      var radios = document.querySelectorAll('.saved-addresses input[name="addressId"]');
      radios.forEach(function (radio) {
        radio.addEventListener('change', function () {
          window.location.href = '/cart?addressId=' + encodeURIComponent(this.value);
        });
      });
    })();
  </script>`
    : '';

  const changeAddressLink = isSavedAddressSelected
    ? '<a href="/account/addresses">Change address</a>'
    : '';

  const body = `
<div class="cart-page">
  <style>${CART_PAGE_STYLE}</style>
  ${savedAddressesSection}
  <form class="card" action="/checkout" method="post" novalidate>
    ${hasSavedAddresses ? `<input type="hidden" name="addressId" value="${escapeHtml(selectedAddressId || '')}">` : ''}
    <div class="delivery-header">
      <div class="delivery-header__title">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.667 8.333c0 5-6.667 9.167-6.667 9.167S3.333 13.333 3.333 8.333a6.667 6.667 0 1 1 13.334 0Z" stroke="#2A7043" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="10" cy="8.333" r="2.083" stroke="#2A7043" stroke-width="1.5"/>
        </svg>
        <h2>Delivery Destination</h2>
      </div>
      <span class="delivery-eta">Est. Delivery: 25-35 mins</span>
    </div>

    ${changeAddressLink}

    <div class="field">
      <label for="recipient-name">Recipient Name</label>
      <input type="text" id="recipient-name" name="recipientName" value="${escapeHtml(recipientName)}"${readonlyAttr}>
    </div>

    <div class="field-row">
      <div class="field${streetAddressError ? ' has-error' : ''}">
        <label for="street-address">Street Address</label>
        <input
          type="text"
          id="street-address"
          name="streetAddress"
          value="${escapeHtml(streetAddress)}"
          ${readonlyAttr}
          ${streetAddressError ? 'aria-invalid="true" aria-describedby="street-address-error"' : ''}
        >
        ${streetAddressError ? '<p class="field-error" id="street-address-error">Street address is required.</p>' : ''}
      </div>
      <div class="field field-apt">
        <label for="apt-suite">Apt / Suite</label>
        <input type="text" id="apt-suite" name="aptSuite" value="${escapeHtml(aptSuite)}">
      </div>
      <div class="field field-apt">
        <label for="floor">Floor</label>
        <input type="text" id="floor" name="floor" value="${escapeHtml(floor)}">
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="city">City</label>
        <input type="text" id="city" name="city" value="${escapeHtml(city)}"${readonlyAttr}>
      </div>
      <div class="field">
        <label for="state">State</label>
        <input type="text" id="state" name="state" value="${escapeHtml(state)}"${readonlyAttr}>
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="postal-code">Postal Code</label>
        <input type="text" id="postal-code" name="postalCode" value="${escapeHtml(postalCode)}"${readonlyAttr}>
      </div>
      <div class="field">
        <label for="country">Country</label>
        <input type="text" id="country" name="country" value="${escapeHtml(country)}"${readonlyAttr}>
      </div>
    </div>

    <div class="field">
      <label for="delivery-instructions">Special Delivery Instructions</label>
      <textarea id="delivery-instructions" name="deliveryInstructions">${escapeHtml(deliveryInstructions)}</textarea>
    </div>

    <button class="btn btn-brand btn-block" type="submit">
      Proceed to Checkout
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="#FFFFFF" stroke-width="1.5"/>
        <path d="M1.5 6.5h13" stroke="#FFFFFF" stroke-width="1.5"/>
      </svg>
    </button>
  </form>
</div>
`;

  return renderLayout('Forno Rosso — Cart', body);
}

module.exports = { renderCartPage };
