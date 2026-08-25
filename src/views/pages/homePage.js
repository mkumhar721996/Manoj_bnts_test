const { renderLayout } = require('../layout');
const brandStory = require('../../content/brandStory');
const { escapeHtml } = require('../../utils/escapeHtml');

const FEATURE_ICONS = {
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-4-6.3 4 1.7-7L2 9.2l7.1-.6z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5z"/></svg>',
  compass: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.6 5.4l-2 5.8-5.8 2 2-5.8z"/></svg>',
};

function renderBrandStorySection() {
  const featureItems = brandStory.features
    .map(
      (feature) => `
      <li class="feature-list__item">
        <span class="feature-list__icon">${FEATURE_ICONS[feature.icon] || ''}</span>
        <div>
          <h3 class="feature-list__title">${escapeHtml(feature.title)}</h3>
          <p class="feature-list__desc">${escapeHtml(feature.description)}</p>
        </div>
      </li>`
    )
    .join('');

  const images = brandStory.images
    .map(
      (image) =>
        `<img class="story-images__photo" src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}">`
    )
    .join('\n      ');

  return `
<section class="brand-story">
  <div class="brand-story__grid">
    <div class="brand-story__content">
      <span class="story-heading__eyebrow">${escapeHtml(brandStory.eyebrow)}</span>
      <h2 class="story-heading__title">${escapeHtml(brandStory.heading)}</h2>
      <p class="brand-story__body">${escapeHtml(brandStory.paragraph)}</p>
      <ul class="feature-list">${featureItems}
      </ul>
    </div>
    <div class="story-images">
      ${images}
    </div>
  </div>
</section>`;
}

function renderHomePage() {
  const body = `
<header class="site-header">
  <span class="brand-wordmark">Facebook</span>
  <div class="header-actions">
    <a class="btn btn-ghost" href="#login-email">Log In</a>
    <a class="btn btn-brand" href="#reg-name">Create Account</a>
  </div>
</header>

<div class="hero">
  <div class="hero-copy">
    <span class="brand-wordmark">facebook</span>
    <p>Connect with friends and the world around you on Facebook. Share updates, photos, and moments with the people who matter most.</p>
  </div>

  <div>
    <div class="card">
      <h2>Log Into Your Account</h2>
      <form action="/login" method="post" novalidate>
        <div class="field">
          <label for="login-email">Email address</label>
          <input type="text" id="login-email" name="email" placeholder="jordan@example.com" autocomplete="username">
        </div>
        <div class="field">
          <label for="login-password">Password</label>
          <input type="password" id="login-password" name="password" placeholder="Enter your password" autocomplete="current-password">
        </div>
        <button class="btn btn-brand btn-block" type="submit">Log In</button>
        <p class="helper-text"><a href="#">Forgotten password?</a></p>
      </form>
    </div>

    <div class="card">
      <h2>Create a New Account</h2>
      <form action="/register" method="post" novalidate>
        <div class="field">
          <label for="reg-name">Full name</label>
          <input type="text" id="reg-name" name="name" placeholder="e.g. Priya Shah">
        </div>
        <div class="field">
          <label for="reg-email">Email address</label>
          <input type="text" id="reg-email" name="email" placeholder="e.g. priya@example.com">
        </div>
        <div class="field">
          <label for="reg-password">New password</label>
          <input type="password" id="reg-password" name="password" placeholder="At least 8 characters">
        </div>
        <button class="btn btn-success btn-block" type="submit">Sign Up</button>
      </form>
    </div>
  </div>
</div>
${renderBrandStorySection()}
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderHomePage };
