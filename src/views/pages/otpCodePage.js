const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderOtpCodePage({ mode, identifier, error } = {}) {
  const isSignup = mode === 'signup';
  const action = isSignup ? '/otp/signup/verify' : '/otp/login/verify';
  const safeIdentifier = escapeHtml(identifier || '');
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
    <h2>Enter your code</h2>
    <p>We sent a verification code to ${safeIdentifier}.</p>
    <form action="${action}" method="post" novalidate>
      <input type="hidden" name="identifier" value="${safeIdentifier}">
      <div class="field">
        <label for="otp-code">Verification code</label>
        <input type="text" id="otp-code" name="code" placeholder="123456">
      </div>
      ${errorHtml}
      <button class="btn btn-brand btn-block" type="submit">Verify</button>
    </form>
  </div>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderOtpCodePage };
