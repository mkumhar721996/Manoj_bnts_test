const { renderLayout } = require('../layout');

const MESSAGES = {
  invalid: 'This password reset link is invalid.',
  used: 'This password reset link has already been used. It is no longer valid.',
  expired: 'This password reset link has expired.',
};

function renderResetPasswordInvalidPage(reason) {
  const message = MESSAGES[reason] || MESSAGES.invalid;
  const offerNewLink = reason === 'used' || reason === 'expired';

  const body = `
<header class="site-header">
  <span class="brand-wordmark">Facebook</span>
  <div class="header-actions">
    <a class="btn btn-ghost" href="/">Log In</a>
  </div>
</header>
<div class="status-screen">
  <div class="status-icon danger">&#33;</div>
  <div class="card">
    <div class="alert alert-danger" role="alert">
      ${message}
    </div>
    ${offerNewLink ? '<a class="btn btn-brand btn-block" href="/forgot-password">Request a new link</a>' : ''}
  </div>
  <a class="back-link" href="/">&larr; Back to homepage</a>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderResetPasswordInvalidPage };
