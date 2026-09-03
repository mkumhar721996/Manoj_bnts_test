const { renderLayout } = require('../layout');

function renderPasswordResetRequestedPage() {
  const body = `
<header class="site-header">
  <span class="brand-wordmark">Facebook</span>
  <div class="header-actions">
    <a class="btn btn-ghost" href="/">Log In</a>
  </div>
</header>
<div class="status-screen">
  <div class="status-icon success">&#10003;</div>
  <div class="card">
    <div class="alert alert-success" role="status">
      If an account exists for that email and is verified, we've sent a password reset link. Please check your inbox.
    </div>
  </div>
  <a class="back-link" href="/">&larr; Back to homepage</a>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderPasswordResetRequestedPage };
