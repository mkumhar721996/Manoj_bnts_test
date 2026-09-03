const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderResetPasswordPage(token, errors = []) {
  const safeToken = escapeHtml(token);
  const errorHtml =
    errors.length > 0
      ? `<div class="alert alert-danger" role="alert"><ul>${errors
          .map((message) => `<li>${escapeHtml(message)}</li>`)
          .join('')}</ul></div>`
      : '';

  const body = `
<header class="site-header">
  <span class="brand-wordmark">Facebook</span>
  <div class="header-actions">
    <a class="btn btn-ghost" href="/">Log In</a>
  </div>
</header>
<div class="status-screen">
  <div class="card">
    <h2>Choose a New Password</h2>
    ${errorHtml}
    <form action="/reset-password" method="post" novalidate>
      <input type="hidden" name="token" value="${safeToken}">
      <div class="field">
        <label for="reset-password">New password</label>
        <input type="password" id="reset-password" name="password" placeholder="At least 8 characters" autocomplete="new-password">
      </div>
      <button class="btn btn-brand btn-block" type="submit">Reset Password</button>
    </form>
  </div>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderResetPasswordPage };
