const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderLoginPage({ redirectTo = '' } = {}) {
  const safeRedirectTo = escapeHtml(redirectTo);
  const body = `
<header class="site-header">
  <span class="brand-wordmark">Facebook</span>
  <div class="header-actions">
    <a class="btn btn-brand" href="/">Create Account</a>
  </div>
</header>
<div class="status-screen">
  <div class="card">
    <h2>Log Into Your Account</h2>
    <form action="/login" method="post" novalidate>
      <input type="hidden" name="redirectTo" value="${safeRedirectTo}">
      <div class="field">
        <label for="login-email">Email address</label>
        <input type="text" id="login-email" name="email" placeholder="jordan@example.com" autocomplete="username">
      </div>
      <div class="field">
        <label for="login-password">Password</label>
        <input type="password" id="login-password" name="password" placeholder="Enter your password" autocomplete="current-password">
      </div>
      <div class="field">
        <label for="login-remember-me">
          <input type="checkbox" id="login-remember-me" name="rememberMe" class="checkbox-input">
          Remember me
        </label>
      </div>
      <button class="btn btn-brand btn-block" type="submit">Log In</button>
      <p class="helper-text"><a href="#">Forgotten password?</a></p>
    </form>
  </div>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderLoginPage };
