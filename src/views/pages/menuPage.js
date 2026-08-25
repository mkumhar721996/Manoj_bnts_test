const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderMenuPage(items) {
  const itemsHtml = items
    .map(
      (item) => `
    <div class="card">
      <h2>${escapeHtml(item.name)}</h2>
      <p>$${item.price.toFixed(2)}</p>
      <form method="post" action="/cart/add/${escapeHtml(item.id)}">
        <button class="btn btn-brand" type="submit">Add to Cart</button>
      </form>
    </div>`
    )
    .join('');

  const body = `
<h1>Our Menu</h1>
${itemsHtml}
`;

  return renderLayout('Our Menu', body);
}

module.exports = { renderMenuPage };
