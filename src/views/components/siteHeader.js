const { renderIcon } = require('./icon');

function renderSiteHeader({ active } = {}) {
  const navLink = (id, label, href) =>
    `<a class="${id === active ? 'nav-link-active is-active' : 'nav-link'}" href="${href}">${label}</a>`;

  return `
<header class="site-header">
  <div class="logo">
    <span class="logo-badge">F</span>
    <span class="wordmark logo-wordmark">Forno Rosso</span>
  </div>
  <nav class="nav-links">
    ${navLink('home', 'Home', '/')}
    ${navLink('menu', 'Our Menu', '/menu')}
    ${navLink('cart', 'Cart', '#cart-panel')}
  </nav>
  <div class="header-cart">
    <span class="header-cart__eta">Estimated delivery: <strong>30 mins</strong></span>
    <button type="button" class="cart-button" id="cart-button" aria-haspopup="true" aria-expanded="false" aria-controls="cart-panel">
      ${renderIcon('shopping-cart')}
      <span id="cart-badge">0</span>
    </button>
  </div>
  <div id="cart-panel" role="dialog" aria-label="Cart">
    <ul id="cart-line-items"></ul>
    <p id="cart-empty-message">Your cart is empty.</p>
  </div>
</header>
`;
}

module.exports = { renderSiteHeader };
