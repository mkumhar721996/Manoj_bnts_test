const { renderLayout } = require('../layout');

function renderHomePage() {
  const body = `
<header class="site-header">
  <span class="brand-wordmark">Forno Rosso</span>
  <div class="header-actions">
    <a class="btn btn-ghost" href="/login">Log In</a>
    <a class="btn btn-brand" href="/register">Create Account</a>
  </div>
</header>

<section class="hero-section">
  <div class="hero-text-container">
    <span class="hero-badge">
      <svg class="hero-badge-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M8 1.667c1.5 2 2.667 3.667 2.667 5.666a2.667 2.667 0 1 1-5.334 0c0-.777.334-1.5.834-2.166.166.5.5.833 1 .833.666 0 1-.667.833-1.334C7.667 3.667 7.833 2.667 8 1.667Z" stroke="#C82D25" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      AUTHENTIC NEAPOLITAN WOODFIRED
    </span>

    <h1 class="hero-heading">Wood-Fired Pizza, <span class="hero-heading-highlight">Delivered Hot</span></h1>

    <p class="hero-description">Baked at 900°F in our stone ovens to perfect charred perfection. Handcrafted sourdough bases fermented for 48 hours. Order now for fast, direct thermal-bag delivery.</p>

    <div class="hero-cta-group">
      <a href="/menu" class="btn-hero-primary">
        Order Online Now
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M3.333 8h9.334M8.667 3.333 13.333 8l-4.666 4.667" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
      <a href="/menu" class="btn-hero-secondary">Explore Full Menu</a>
    </div>
  </div>

  <div class="hero-image-wrapper">
    <img class="hero-image" src="/images/hero-pizza.png" alt="Wood-fired Margherita pizza fresh from the oven">
  </div>
</section>
`;

  return renderLayout('Forno Rosso', body);
}

module.exports = { renderHomePage };
