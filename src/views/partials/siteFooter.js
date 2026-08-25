function renderSiteFooter() {
  return `
<footer class="site-footer">
  <div class="site-footer__section">
    <h3>Hours</h3>
    <p id="storeHours">Mon&ndash;Sun: 10:00 AM &ndash; 10:00 PM</p>
  </div>
  <div class="site-footer__section">
    <h3>Location</h3>
    <p id="storeLocation">123 Market Street, Springfield</p>
  </div>
  <div class="site-footer__section">
    <h3>Contact</h3>
    <p id="storeContact">(555) 123-4567 &middot; hello@example.com</p>
  </div>
  <div class="site-footer__section">
    <h3>Follow Us</h3>
    <a class="social-link" href="#">Facebook</a>
    <a class="social-link" href="#">Instagram</a>
    <a class="social-link" href="#">Twitter</a>
  </div>
  <div class="site-footer__legal">
    <a class="legal-link" href="#">Terms of Service</a>
    <a class="legal-link" href="#">Privacy Policy</a>
  </div>
</footer>
`;
}

module.exports = { renderSiteFooter };
