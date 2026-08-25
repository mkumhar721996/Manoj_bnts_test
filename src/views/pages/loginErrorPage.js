const { renderLayout } = require('../layout');

function renderLoginErrorPage() {
  const body = `
<div class="status-screen">
  <div class="status-icon danger">&#33;</div>
  <div class="card">
    <div class="alert alert-danger" role="alert">
      The email or password you entered is incorrect. Access denied.
    </div>
    <form action="/login" method="post" novalidate>
      <div class="field">
        <label for="login-email-2">Email address</label>
        <input type="text" id="login-email-2" name="email" placeholder="jordan@example.com">
      </div>
      <div class="field">
        <label for="login-password-2">Password</label>
        <input type="password" id="login-password-2" name="password" placeholder="Enter your password">
      </div>
      <button class="btn btn-brand btn-block" type="submit">Try Again</button>
    </form>
  </div>
  <a class="back-link" href="/">&larr; Back to homepage</a>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderLoginErrorPage };
