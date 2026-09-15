const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderOtpIdentifierPage({ mode, error, value } = {}) {
  const isSignup = mode === 'signup';
  const action = isSignup ? '/otp/signup' : '/otp/login';
  const heading = isSignup ? 'Sign Up' : 'Log In';
  const safeValue = escapeHtml(value || '');
  const errorHtml = error
    ? `<div class="field has-error">
        <div class="field-error">${escapeHtml(error)}</div>
      </div>`
    : '';

  const body = `
<header class="site-header">
  <span class="brand-wordmark">Facebook</span>
</header>
<div class="status-screen">
  <div class="card">
    <h2>${heading}</h2>
    <form action="${action}" method="post" novalidate>
      <div class="field">
        <label for="otp-identifier">Phone number or email address</label>
        <input type="text" id="otp-identifier" name="identifier" value="${safeValue}" placeholder="jordan@example.com">
      </div>
      ${errorHtml}
      <button class="btn btn-brand btn-block" type="submit">Continue</button>
    </form>
  </div>
  <a class="back-link" href="/">&larr; Back to homepage</a>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderOtpIdentifierPage };
