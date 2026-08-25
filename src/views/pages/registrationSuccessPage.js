const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderRegistrationSuccessPage(name, email) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const body = `
<div class="status-screen">
  <div class="status-icon success">&#10003;</div>
  <div class="card">
    <div class="alert alert-success" role="status">
      Account created for <strong>${safeName}</strong>. A confirmation has been sent to <strong>${safeEmail}</strong>.
    </div>
    <p>Welcome to Facebook! You can now log in with your new account.</p>
    <a class="btn btn-brand btn-block" style="margin-top: var(--space-4); display: block; text-align: center;" href="/">Continue to Log In</a>
  </div>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderRegistrationSuccessPage };
