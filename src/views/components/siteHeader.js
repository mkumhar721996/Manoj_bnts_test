const { escapeHtml } = require('../../utils/escapeHtml');

const NAV_LINKS = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'menu', label: 'Our Menu', href: '/menu' },
  { id: 'cart', label: 'Cart', href: '/cart' },
];

function renderNavLink(link, activePath) {
  const isActive = link.href === activePath;
  const activeClass = isActive ? ' is-active' : '';
  return `<a class="nav-link${activeClass}" href="${link.href}">${escapeHtml(link.label)}</a>`;
}

function renderSiteHeader({ activePath, cartCount, etaLabel, etaValue }) {
  const navLinksHtml = NAV_LINKS.map((link) => renderNavLink(link, activePath)).join('\n    ');
  const hiddenAttr = cartCount === 0 ? ' hidden' : '';

  return `
<header class="site-header">
  <a class="brand-logo" href="/">
    <span class="brand-logo-badge">F</span>
    <span class="brand-wordmark">Forno Rosso</span>
  </a>
  <nav class="primary-nav">
    ${navLinksHtml}
  </nav>
  <div class="header-cart-summary">
    <span class="delivery-eta">
      <span class="delivery-eta-label">${escapeHtml(etaLabel)}</span>
      <span class="delivery-eta-value">${escapeHtml(etaValue)}</span>
    </span>
    <a class="cart-indicator-btn" href="/cart">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <span id="cart-badge"${hiddenAttr}>${cartCount}</span>
    </a>
  </div>
</header>
`;
}

module.exports = { renderSiteHeader };
