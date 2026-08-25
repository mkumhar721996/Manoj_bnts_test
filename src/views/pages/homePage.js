const { renderMarketingLayout } = require('../marketingLayout');
const { renderSiteHeader } = require('../components/siteHeader');
const { renderIcon } = require('../components/icon');

const PIZZAS = [
  {
    id: 'diavola',
    name: 'Diavola',
    price: '$16.50',
    description:
      'Spicy calabrian salami, house-pulled fresh mozzarella, san marzano tomato base, organic chili oil, fresh basil leaves.',
    image: '/images/pizza-diavola.png',
  },
  {
    id: 'funghi-tartufo',
    name: 'Funghi Selvatici &amp; Tartufo',
    price: '$18.00',
    description:
      'Roasted wild porcini and cremini mushrooms, truffle-infused olive oil, white mozzarella base, shaved pecorino.',
    image: '/images/pizza-funghi-tartufo.png',
  },
  {
    id: 'margherita',
    name: 'Classic Margherita',
    price: '$14.50',
    description:
      'Imported San Marzano tomato sauce, fresh buffalo mozzarella, fragrant fresh basil, extra virgin olive oil.',
    image: '/images/pizza-margherita.png',
  },
  {
    id: 'prosciutto-rucola',
    name: 'Prosciutto Crudo e Rucola',
    price: '$19.00',
    description:
      'Prosciutto di Parma cured ham, fresh peppery wild arugula, shaved parmigiano-reggiano, balsamic glaze reduction.',
    image: '/images/pizza-prosciutto-rucola.png',
  },
];

const FEATURES = [
  {
    icon: 'star',
    title: '100% Imported San Marzano Tomatoes',
    description: 'Sourced directly from fertile Campania volcano soils for a sweet, low-acid base.',
  },
  {
    icon: 'shield',
    title: 'Fior di Latte &amp; Fresh Mozzarella',
    description:
      'Hand-stretched daily, creating the classic pool texture that blends beautifully under high fire.',
  },
  {
    icon: 'compass',
    title: '900°F Stone Hearth Wood Oven',
    description:
      'Powered by seasoned hickory and oak to lock in flavors and produce perfect crust blistering in 90 seconds.',
  },
];

function renderPizzaCard(pizza) {
  return `
<article class="pizza-card">
  <img src="${pizza.image}" alt="${pizza.name}">
  <div class="pizza-card__body">
    <div class="pizza-card__header">
      <span class="card-title">${pizza.name}</span>
      <span class="price-text pizza-card__price">${pizza.price}</span>
    </div>
    <p class="pizza-card__description body-text">${pizza.description}</p>
    <button
      type="button"
      class="btn btn-dark"
      data-item-id="${pizza.id}"
      data-item-name="${pizza.name}"
      data-item-price="${pizza.price}"
    >
      ${renderIcon('plus')}
      Add to Order
    </button>
  </div>
</article>`;
}

function renderFeatureItem(feature) {
  return `
<div class="feature-item">
  <span class="icon-circle feature-item__icon">${renderIcon(feature.icon)}</span>
  <div>
    <h3 class="feature-title">${feature.title}</h3>
    <p class="feature-item__description">${feature.description}</p>
  </div>
</div>`;
}

function renderHomePage() {
  const body = `
${renderSiteHeader({ active: 'home' })}

<section class="hero">
  <div class="hero-copy">
    <span class="eyebrow-label eyebrow-pill">
      ${renderIcon('fire-extinguisher')}
      AUTHENTIC NEAPOLITAN WOODFIRED
    </span>
    <h1 class="hero-title">
      <span class="lead">Wood-Fired Pizza,</span>
      <span class="accent">Delivered Hot</span>
    </h1>
    <p class="body-lg-text hero-description">
      Baked at 900°F in our stone ovens to perfect charred perfection. Handcrafted sourdough
      bases fermented for 48 hours. Order now for fast, direct thermal-bag delivery.
    </p>
    <div class="hero-ctas">
      <a class="btn btn-primary" href="/menu">Order Online Now ${renderIcon('arrow-right')}</a>
      <a class="btn btn-outline" href="/menu">Explore Full Menu</a>
    </div>
  </div>
  <div class="hero-image-wrapper">
    <img src="/images/hero.png" alt="Wood-fired Margherita pizza">
  </div>
</section>

<section class="delivery-banner">
  <div class="delivery-banner__promise">
    <span class="icon-circle" style="width: 40px; height: 40px;">${renderIcon('truck')}</span>
    <div class="delivery-banner__text">
      <h3>Free Delivery On Orders Over $35</h3>
      <p>Craving quality? Skip the delivery fee entirely inside our active zones.</p>
    </div>
  </div>
  <div class="stats-row">
    <div class="stat-item">
      <span class="stat-item__label">Average ETA</span>
      <span class="stat-item__value">25 - 35 Min</span>
    </div>
    <div class="stat-item stat-item--right">
      <span class="stat-item__label">Pizza Temperature</span>
      <span class="stat-item__value">Piping Hot Guaranteed</span>
    </div>
  </div>
</section>

<section class="featured-section">
  <div class="section-heading section-heading--center">
    <span class="eyebrow-label section-heading__eyebrow">Chef Recommendations</span>
    <h2 class="section-title">Popular Sourdough Pizzas</h2>
    <span class="section-heading__rule"></span>
  </div>
  <div class="featured-grid">
    ${PIZZAS.map(renderPizzaCard).join('\n')}
  </div>
</section>

<section class="story-section">
  <div class="story-copy">
    <div class="section-heading section-heading--left">
      <span class="eyebrow-label section-heading__eyebrow section-heading__eyebrow--green">The Sourdough Secret</span>
      <h2 class="section-title">Our Passion for the Perfect Crust</h2>
    </div>
    <p class="body-text story-description">
      At Forno Rosso, we respect the traditions of Neapolitan pizzaiolos while implementing
      modern techniques. We ferment our proprietary sourdough mother starter for 48 hours. This
      process creates a light, bubbly, and incredibly digestible dough with complex flavor
      profiles.
    </p>
    <div class="feature-list">
      ${FEATURES.map(renderFeatureItem).join('\n')}
    </div>
  </div>
  <div class="story-image-collage">
    <img src="/images/story-dough.png" alt="Chef stretching sourdough by hand">
    <img src="/images/story-oven.png" alt="Pizza baking in the wood-fired oven">
  </div>
</section>
`;

  return renderMarketingLayout('Forno Rosso — Wood-Fired Pizza, Delivered Hot', body);
}

module.exports = { renderHomePage };
