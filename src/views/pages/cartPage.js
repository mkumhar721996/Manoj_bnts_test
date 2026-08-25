const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

const CART_ITEMS = [
  {
    thumbnail: '/images/cart/classic-margherita.png',
    name: 'Classic Margherita',
    variant: 'Neapolitan Woodfired',
    quantity: 2,
    price: '$29.00',
  },
  {
    thumbnail: '/images/cart/diavola.png',
    name: 'Diavola',
    variant: 'Neapolitan Woodfired',
    quantity: 1,
    price: '$16.50',
  },
  {
    thumbnail: '/images/cart/rosemary-garlic-focaccia.png',
    name: 'Rosemary Garlic Focaccia',
    variant: 'Neapolitan Woodfired',
    quantity: 1,
    price: '$8.50',
  },
];

function formatMoney(amount) {
  return `$${amount.toFixed(2)}`;
}

function renderCartItemRow(item) {
  return `
      <div class="cart-item-row">
        <img class="cart-item-thumb" src="${item.thumbnail}" alt="${escapeHtml(item.name)}">
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          <div class="cart-item-variant">${escapeHtml(item.variant)}</div>
        </div>
        <div class="cart-item-qty">
          <button type="button" aria-label="Decrease quantity">-</button>
          <span>${item.quantity}</span>
          <button type="button" aria-label="Increase quantity">+</button>
        </div>
        <div class="cart-item-price">${item.price}</div>
        <button type="button" class="cart-item-remove">Remove</button>
      </div>`;
}

function renderPromoCodeField({ promoCode, promoError, typedCode }) {
  if (promoCode) {
    return `
        <div class="promo-code-field">
          <label for="promoCode">Promo Code</label>
          <div class="promo-code-row">
            <div class="promo-input-wrap">
              <input type="text" id="promoCode" class="promo-input promo-input--applied" value="${escapeHtml(promoCode.code)}" readonly>
              <span class="promo-check-icon" aria-hidden="true">&#10003;</span>
            </div>
            <form method="post" action="/cart/promo/remove">
              <button type="submit" class="promo-btn promo-btn-applied">Applied</button>
            </form>
          </div>
        </div>`;
  }

  const inputClass = promoError ? 'promo-input promo-input--error' : 'promo-input';
  const value = typedCode ? escapeHtml(typedCode) : '';
  const errorHtml = promoError
    ? `\n          <p class="cart-field-error">${escapeHtml(promoError)}</p>`
    : '';

  return `
        <div class="promo-code-field">
          <label for="promoCode">Promo Code</label>
          <form method="post" action="/cart/promo/apply" class="promo-code-form">
            <input type="text" id="promoCode" name="promoCode" class="${inputClass}" placeholder="Enter promo code" value="${value}">
            <button type="submit" class="promo-btn">Apply</button>
          </form>${errorHtml}
        </div>`;
}

function renderCartPage(summary, options = {}) {
  const { promoError, typedCode } = options;
  const { subtotal, deliveryFee, ovenSurcharge, salesTax, discount, total, promoCode } = summary;

  const discountRowHtml = promoCode
    ? `
        <div class="summary-line">
          <span>Discount</span>
          <span class="summary-line-value is-success">-${formatMoney(discount)}</span>
        </div>`
    : '';

  const deliveryFeeDisplay = deliveryFee === 0 ? 'FREE' : formatMoney(deliveryFee);

  const body = `
<div class="cart-page">
  <header class="cart-site-header">
    <div class="cart-brand-mark">
      <span class="cart-brand-logo">F</span>
      Forno Rosso
    </div>
    <nav class="cart-nav">
      <a href="/">Home</a>
      <a href="/">Our Menu</a>
      <a href="/cart" class="is-active">Cart</a>
    </nav>
    <div class="cart-header-actions">
      <span class="cart-eta">Estimated delivery: <span class="cart-eta-value">30 mins</span></span>
      <span class="cart-header-cart-badge">
        <span class="cart-badge-count">3</span>
      </span>
    </div>
  </header>

  <div class="cart-body">
    <div class="cart-left">
      <section class="cart-card">
        <div class="cart-card-header">
          <h2>Your Selected Order</h2>
          <span class="cart-card-meta">3 Items</span>
        </div>
        ${CART_ITEMS.map(renderCartItemRow).join('')}
      </section>

      <section class="cart-card">
        <div class="cart-section-heading">
          <h2>Delivery Destination</h2>
          <span class="cart-eta-badge">Est. Delivery: 25-35 mins</span>
        </div>
        <div class="cart-field-row">
          <div class="cart-field">
            <label for="streetAddress">Street Address</label>
            <input type="text" id="streetAddress" value="128 Pizzaiolo Boulevard" readonly>
          </div>
          <div class="cart-field">
            <label for="aptSuite">Apt / Suite</label>
            <input type="text" id="aptSuite" value="Penthouse 4B" readonly>
          </div>
        </div>
        <div class="cart-field">
          <label for="deliveryInstructions">Special Delivery Instructions</label>
          <textarea id="deliveryInstructions" readonly>Ring doorbell or leave at front lobby desk. Please keep thermal bag zipped until handover!</textarea>
        </div>
      </section>
    </div>

    <aside class="cart-card">
      <div class="cart-card-header">
        <h2>Order Summary</h2>
      </div>
      <div class="summary-line">
        <span>Subtotal</span>
        <span class="summary-line-value">${formatMoney(subtotal)}</span>
      </div>${discountRowHtml}
      <div class="summary-line">
        <span>Delivery Fee</span>
        <span class="summary-line-value${deliveryFee === 0 ? ' is-success' : ''}">${deliveryFeeDisplay}</span>
      </div>
      <div class="summary-line">
        <span>Oven Surcharge (Eco-box)</span>
        <span class="summary-line-value">${formatMoney(ovenSurcharge)}</span>
      </div>
      <div class="summary-line">
        <span>Sales Tax (8.5%)</span>
        <span class="summary-line-value">${formatMoney(salesTax)}</span>
      </div>
      <div class="summary-total">
        <span class="summary-total-label">Total</span>
        <span class="summary-total-value">${formatMoney(total)}</span>
      </div>
      ${renderPromoCodeField({ promoCode, promoError, typedCode })}
      <button type="button" class="cart-checkout-btn">Proceed to Checkout</button>
    </aside>
  </div>
</div>
`;

  return renderLayout('Cart — Forno Rosso', body);
}

module.exports = { renderCartPage };
