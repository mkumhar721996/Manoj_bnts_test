const { renderLayout } = require('../layout');

function renderForgotPasswordPage() {
  const body = `
<header class="site-header">
  <span class="brand-wordmark">Facebook</span>
  <div class="header-actions">
    <a class="btn btn-ghost" href="/">Log In</a>
  </div>
</header>
<div class="status-screen">
  <div class="card">
    <h2>Find Your Account</h2>
    <p class="helper-text" style="text-align: left; margin-bottom: var(--space-4);">
      Enter the email address associated with your account and we'll send you a link to reset your password.
    </p>
    <form action="/forgot-password" method="post" novalidate>
      <div class="field">
        <label for="forgot-email">Email address</label>
        <input type="text" id="forgot-email" name="email" placeholder="jordan@example.com" autocomplete="username">
      </div>
      <button class="btn btn-brand btn-block" type="submit">Send Reset Link</button>
    </form>
  </div>
  <a class="back-link" href="/">&larr; Back to homepage</a>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderForgotPasswordPage };
