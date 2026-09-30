const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderOtpAccountPage({ identifier } = {}) {
  const safeIdentifier = escapeHtml(identifier || '');
  const body = `
<header class="site-header">
  <span class="brand-wordmark">Facebook</span>
  <div class="header-actions">
    <form action="/otp/logout" method="post">
      <button class="btn btn-ghost" type="submit">Log Out</button>
    </form>
  </div>
</header>
<div class="status-screen">
  <div class="card">
    <div class="alert alert-success" role="status">
      You're logged in as ${safeIdentifier}.
    </div>
  </div>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderOtpAccountPage };
