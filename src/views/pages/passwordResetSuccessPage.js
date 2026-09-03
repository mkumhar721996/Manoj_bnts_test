const { renderLayout } = require('../layout');

function renderPasswordResetSuccessPage() {
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
      Your password has been reset successfully.
    </div>
    <p>You can now log in with your new password.</p>
    <a class="btn btn-brand btn-block" style="margin-top: var(--space-4); display: block; text-align: center;" href="/">Continue to Log In</a>
  </div>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderPasswordResetSuccessPage };
