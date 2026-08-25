const { renderLayout } = require('../layout');

function renderLoginPage() {
  const body = `
<header class="site-header">
  <span class="brand-wordmark">Forno Rosso</span>
  <div class="header-actions">
    <a class="btn btn-brand" href="/register">Create Account</a>
  </div>
</header>
<div class="status-screen">
  <div class="card">
    <h2>Log Into Your Account</h2>
    <form action="/login" method="post" novalidate>
      <div class="field">
        <label for="login-email">Email address</label>
        <input type="text" id="login-email" name="email" placeholder="jordan@example.com" autocomplete="username">
      </div>
      <div class="field">
        <label for="login-password">Password</label>
        <input type="password" id="login-password" name="password" placeholder="Enter your password" autocomplete="current-password">
      </div>
      <button class="btn btn-brand btn-block" type="submit">Log In</button>
    </form>
  </div>
  <a class="back-link" href="/">&larr; Back to homepage</a>
</div>
`;

  return renderLayout('Forno Rosso — Log In', body);
}

module.exports = { renderLoginPage };
