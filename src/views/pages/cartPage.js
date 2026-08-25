const { renderCartLayout } = require('../cartLayout');
const { escapeHtml } = require('../../utils/escapeHtml');
const { formatCents } = require('../../utils/currency');

function renderHeader(itemCount) {
  return `
<header class="cart-header">
  <div class="cart-logo">
    <span class="cart-logo-badge">F</span>
    <span class="cart-logo-wordmark">Forno Rosso</span>
  </div>
  <button class="cart-icon-button" type="button" aria-label="Cart">
    &#128722;
    <span class="cart-badge">${itemCount}</span>
  </button>
</header>`;
}

function renderLineItem(item) {
  const lineTotalCents = item.unitPriceCents * item.quantity;
  const decrementDisabled = item.quantity <= 1;

  return `
<div class="cart-line-item">
  <div class="cart-line-item-info">
    <div class="cart-line-item-name">${escapeHtml(item.name)}</div>
    <div class="cart-line-item-variant">${escapeHtml(item.variant)}</div>
    <div class="cart-line-item-unit-price">${formatCents(item.unitPriceCents)} each</div>
  </div>
  <div class="cart-stepper">
    <form class="cart-stepper-form" action="/cart/items/${encodeURIComponent(item.id)}/decrement" method="post">
      <button class="cart-stepper-btn" type="submit" aria-label="Decrease quantity"${decrementDisabled ? ' disabled' : ''}>&minus;</button>
    </form>
    <span class="cart-stepper-value">${item.quantity}</span>
    <form class="cart-stepper-form" action="/cart/items/${encodeURIComponent(item.id)}/increment" method="post">
      <button class="cart-stepper-btn" type="submit" aria-label="Increase quantity">+</button>
    </form>
  </div>
  <div class="cart-line-item-actions">
    <div class="cart-line-item-price">${formatCents(lineTotalCents)}</div>
    <form class="cart-remove-form" action="/cart/items/${encodeURIComponent(item.id)}/remove" method="post">
      <button class="cart-remove-btn" type="submit">Remove</button>
    </form>
  </div>
</div>`;
}

function renderOrderCard(items) {
  const body =
    items.length === 0
      ? '<p class="cart-empty">Your cart is empty.</p>'
      : items.map(renderLineItem).join('');

  return `
<div class="cart-card">
  <div class="cart-card-header">
    <h2 class="cart-card-title">Your Selected Order</h2>
    <span class="cart-card-meta">${items.length} Items</span>
  </div>
  ${body}
</div>`;
}

function renderSummaryCard(summary) {
  return `
<div class="cart-card">
  <div class="cart-card-header">
    <h2 class="cart-card-title">Order Summary</h2>
  </div>
  <div class="cart-summary-row">
    <span>Subtotal</span>
    <span class="cart-summary-value">${formatCents(summary.subtotalCents)}</span>
  </div>
  <div class="cart-summary-row success">
    <span>Delivery Fee</span>
    <span class="cart-summary-value">FREE</span>
  </div>
  <div class="cart-summary-row">
    <span>Oven Surcharge (Eco-box)</span>
    <span class="cart-summary-value">${formatCents(summary.surchargeCents)}</span>
  </div>
  <div class="cart-summary-row">
    <span>Sales Tax (8.5%)</span>
    <span class="cart-summary-value">${formatCents(summary.taxCents)}</span>
  </div>
  <div class="cart-summary-total">
    <span>Total</span>
    <span class="cart-summary-value">${formatCents(summary.totalCents)}</span>
  </div>
</div>`;
}

function renderCartPage(items, summary) {
  const body = `
${renderHeader(items.length)}
<div class="cart-body">
  <div class="cart-left">
    ${renderOrderCard(items)}
  </div>
  <div class="cart-right">
    ${renderSummaryCard(summary)}
  </div>
</div>`;

  return renderCartLayout('Cart - Forno Rosso', body);
}

module.exports = { renderCartPage };
