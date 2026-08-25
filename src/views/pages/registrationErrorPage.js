const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderRegistrationErrorPage(errors, name, email) {
  const errorItems = errors.map((message) => `<li>${escapeHtml(message)}</li>`).join('');
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const body = `
<header class="site-header">
  <span class="brand-wordmark">Facebook</span>
  <div class="header-actions">
    <a class="btn btn-ghost" href="/">Log In</a>
    <a class="btn btn-brand" href="/">Create Account</a>
  </div>
</header>
<div class="status-screen">
  <div class="card">
    <div class="alert alert-danger" role="alert">
      <strong>We couldn't create your account.</strong>
      <div>Please fix the following before continuing:</div>
      <ul>${errorItems}</ul>
    </div>
    <h2>Create a New Account</h2>
    <form action="/register" method="post" novalidate>
      <div class="field">
        <label for="reg-name-2">Full name</label>
        <input type="text" id="reg-name-2" name="name" value="${safeName}" placeholder="e.g. Priya Shah">
      </div>
      <div class="field">
        <label for="reg-email-2">Email address</label>
        <input type="text" id="reg-email-2" name="email" value="${safeEmail}" placeholder="e.g. priya@example.com">
      </div>
      <div class="field">
        <label for="reg-password-2">New password</label>
        <input type="password" id="reg-password-2" name="password" placeholder="At least 8 characters">
      </div>
      <button class="btn btn-success btn-block" type="submit">Try Again</button>
    </form>
  </div>
  <a class="back-link" href="/">&larr; Back to homepage</a>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderRegistrationErrorPage };
