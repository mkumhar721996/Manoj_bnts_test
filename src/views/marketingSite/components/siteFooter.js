const businessInfo = require('../../../config/businessInfo');

const SOCIAL_ICONS = {
  instagram:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
  facebook:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
  twitter:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>',
};

function renderSocialRow() {
  const icons = businessInfo.socialLinks
    .map(
      (social) => `
    <a
      class="social-icon-link social-icon-link--${social.id}"
      href="${social.href}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="${social.label}"
    >${SOCIAL_ICONS[social.id] || ''}</a>`
    )
    .join('');

  return `<div class="footer-social-row">${icons}</div>`;
}

function renderFooterBrand() {
  return `
<div class="footer-brand">
  <div class="footer-brand__logo">
    <span class="footer-brand__badge">${businessInfo.brand.mark}</span>
    <span class="footer-brand__wordmark">${businessInfo.brand.name}</span>
  </div>
  <p class="footer-brand__blurb">${businessInfo.brand.blurb}</p>
  ${renderSocialRow()}
</div>`;
}

function renderKitchenHoursColumn() {
  const rows = businessInfo.kitchenHours
    .map(
      ({ label, value }) => `
    <div class="footer-info-row">
      <div class="footer-info-row__label">${label}</div>
      <div class="footer-info-row__value">${value}</div>
    </div>`
    )
    .join('');

  return `
<div class="footer-column">
  <h3 class="footer-column__heading">Kitchen Hours</h3>
  ${rows}
</div>`;
}

function renderLocationColumn() {
  const { address, deliveryPhone, deliveryEmail } = businessInfo.location;

  return `
<div class="footer-column">
  <h3 class="footer-column__heading">Pizzeria Location</h3>
  <p class="footer-location__address">${address}</p>
  <div class="footer-location__contact">
    <p>Delivery: ${deliveryPhone}</p>
    <p>Email: ${deliveryEmail}</p>
  </div>
</div>`;
}

function renderFooterBottom() {
  const links = businessInfo.legalLinks
    .map(
      (link) => `<li><a href="${link.href}">${link.label}</a></li>`
    )
    .join('');

  return `
<div class="site-footer__bottom">
  <p class="site-footer__copyright">${businessInfo.copyright}</p>
  <ul class="footer-legal-links">${links}</ul>
</div>`;
}

function renderSiteFooter() {
  return `
<footer class="site-footer">
  <div class="site-footer__top">
    ${renderFooterBrand()}
    ${renderKitchenHoursColumn()}
    ${renderLocationColumn()}
  </div>
  <hr class="site-footer__divider">
  ${renderFooterBottom()}
</footer>`;
}

module.exports = { renderSiteFooter };
