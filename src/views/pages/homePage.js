const { renderLayout } = require('../layout');

function renderHomePage() {
  const body = `
<header class="site-header">
  <span class="brand-wordmark">Facebook</span>
  <div class="header-actions">
    <a class="btn btn-ghost" href="#login-email">Log In</a>
    <a class="btn btn-brand" href="#reg-name">Create Account</a>
  </div>
</header>

<div class="hero">
  <div class="hero-copy">
    <span class="brand-wordmark">facebook</span>
    <p>Connect with friends and the world around you on Facebook. Share updates, photos, and moments with the people who matter most.</p>
  </div>

  <div>
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
        <p class="helper-text"><a href="#">Forgotten password?</a></p>
      </form>
    </div>

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
  </div>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderHomePage };
