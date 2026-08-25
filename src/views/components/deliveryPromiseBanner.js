const TRUCK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect x="1" y="6" width="14" height="10" rx="1"></rect>
  <path d="M15 10h4l3 3v3h-7z"></path>
  <circle cx="6" cy="18" r="2"></circle>
  <circle cx="17" cy="18" r="2"></circle>
</svg>`;

function renderDeliveryPromiseBanner() {
  return `<section class="delivery-banner">
  <div class="delivery-highlight">
    <span class="icon-badge">${TRUCK_ICON}</span>
    <div class="delivery-highlight-text">
      <p class="delivery-highlight-title">Free Delivery On Orders Over $35</p>
      <p class="delivery-highlight-subtitle">Craving quality? Skip the delivery fee entirely inside our active zones.</p>
    </div>
  </div>
  <div class="stat-group">
    <div class="stat-block stat-block--eta">
      <p class="stat-label">Average ETA</p>
      <p class="stat-value">25 - 35 Min</p>
    </div>
    <div class="stat-block stat-block--temp">
      <p class="stat-label">Pizza Temperature</p>
      <p class="stat-value">Piping Hot Guaranteed</p>
    </div>
  </div>
</section>`;
}

module.exports = { renderDeliveryPromiseBanner };
