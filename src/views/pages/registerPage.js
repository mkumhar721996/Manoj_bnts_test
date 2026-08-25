const { renderLayout } = require('../layout');

function renderRegisterPage() {
  const body = `
<header class="site-header">
  <span class="brand-wordmark">Forno Rosso</span>
  <div class="header-actions">
    <a class="btn btn-ghost" href="/login">Log In</a>
  </div>
</header>
<div class="status-screen">
  <div class="card">
    <h2>Create a New Account</h2>
    <form action="/register" method="post" novalidate>
      <div class="field">
        <label for="reg-name">Full name</label>
        <input type="text" id="reg-name" name="name" placeholder="e.g. Priya Shah">
      </div>
      <div class="field">
        <label for="reg-email">Email address</label>
        <input type="text" id="reg-email" name="email" placeholder="e.g. priya@example.com">
      </div>
      <div class="field">
        <label for="reg-password">New password</label>
        <input type="password" id="reg-password" name="password" placeholder="At least 8 characters">
      </div>
      <button class="btn btn-success btn-block" type="submit">Sign Up</button>
    </form>
  </div>
  <a class="back-link" href="/">&larr; Back to homepage</a>
</div>
`;

  return renderLayout('Forno Rosso — Create Account', body);
}

module.exports = { renderRegisterPage };
