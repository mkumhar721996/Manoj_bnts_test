function renderGlobalNav(cartCount) {
  return `
<header class="global-nav">
  <span class="brand-wordmark">Facebook</span>
  <nav class="global-nav__links">
    <a class="global-nav__link" href="/">Home</a>
    <a class="global-nav__link" href="/menu">Our Menu</a>
    <a class="global-nav__link" href="/cart">Cart <span class="cart-badge" id="cartBadge">${cartCount}</span></a>
  </nav>
  <div id="deliveryEta" class="delivery-eta">Estimated delivery: 30&ndash;45 min</div>
</header>
`;
}

module.exports = { renderGlobalNav };
