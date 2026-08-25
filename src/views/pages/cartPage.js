const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderCartPage(cartItems) {
  const body =
    cartItems.length === 0
      ? `
<h1>Your Cart</h1>
<p>Your cart is empty.</p>
`
      : `
<h1>Your Cart</h1>
${cartItems
  .map(
    (item) => `
    <div class="card">
      <h2>${escapeHtml(item.name)}</h2>
      <p>Qty: ${item.quantity} &middot; $${item.price.toFixed(2)}</p>
      <form method="post" action="/cart/remove/${escapeHtml(item.itemId)}">
        <button class="btn btn-ghost" type="submit">Remove</button>
      </form>
    </div>`
  )
  .join('')}
`;

  return renderLayout('Your Cart', body);
}

module.exports = { renderCartPage };
