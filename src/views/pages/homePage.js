const { escapeHtml } = require('../../utils/escapeHtml');
const { HOME_PAGE_STYLE } = require('./homePageStyle');

function renderSiteHeader() {
  return `
<header class="site-header">
  <div class="brand-logo">
    <span class="brand-logo__mark">F</span>
    <span class="brand-logo__word">Forno Rosso</span>
  </div>
  <nav class="nav-bar">
    <a class="nav-link is-active" href="/">Home</a>
    <a class="nav-link" href="#">Our Menu</a>
    <a class="nav-link" href="#">Cart</a>
  </nav>
  <div class="header-cart-status">
    <span class="header-cart-status__eta">Estimated delivery: <strong>30 mins</strong></span>
    <button class="cart-button" type="button" aria-label="View cart">
      &#128722; <span id="cartCount">0</span>
    </button>
  </div>
</header>`;
}

function renderPizzaCard(pizza) {
  return `
<article class="pizza-card">
  <img class="pizza-card__image" src="${escapeHtml(pizza.image)}" alt="${escapeHtml(pizza.name)}">
  <div class="pizza-card__body">
    <div class="pizza-card__row">
      <span class="pizza-card__name">${escapeHtml(pizza.name)}</span>
      <span class="pizza-card__price">${escapeHtml(pizza.price)}</span>
    </div>
    <p class="pizza-card__description">${escapeHtml(pizza.description)}</p>
    <button class="add-to-order-btn" type="button" data-pizza-name="${escapeHtml(pizza.name)}">
      + Add to Order
    </button>
  </div>
</article>`;
}

function renderPopularPizzasSection(featuredPizzas, featuredError) {
  let content;
  if (featuredError) {
    content =
      '<p class="menu-state-message is-error">We couldn\'t load our featured pizzas. Please try again later.</p>';
  } else if (featuredPizzas.length === 0) {
    content =
      '<p class="menu-state-message">No featured pizzas are available right now — check back soon!</p>';
  } else {
    content = `<div class="pizza-card-grid">${featuredPizzas.map(renderPizzaCard).join('')}</div>`;
  }

  return `
<section class="popular-pizzas-section">
  <div class="section-heading">
    <span class="section-heading__eyebrow">Chef Recommendations</span>
    <h2 class="section-heading__title">Popular Sourdough Pizzas</h2>
    <div class="section-heading__accent"></div>
  </div>
  ${content}
</section>`;
}

function renderHomePage({ featuredPizzas = [], featuredError = false } = {}) {
  const body = `
${renderSiteHeader()}
${renderPopularPizzasSection(featuredPizzas, featuredError)}
<div id="toastContainer" aria-live="polite"></div>
<script src="/js/pizzaMenu.js" defer></script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Forno Rosso</title>
<style>${HOME_PAGE_STYLE}</style>
</head>
<body>
${body}
</body>
</html>
`;
}

module.exports = { renderHomePage };
