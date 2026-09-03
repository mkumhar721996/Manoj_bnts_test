const { createTokenStore } = require('./createTokenStore');

const DEFAULT_TTL_MS = 60 * 60 * 1000;

// AC3: requesting a new reset link must invalidate any still-active previous
// link for the same email, unlike verificationTokenStore's resend, which lets
// old and new tokens coexist.
function invalidateUnusedTokensForEmail(tokens, email) {
  for (const record of tokens.values()) {
    if (record.email === email && !record.used) {
      record.used = true;
    }
  }
}

module.exports = createTokenStore({
  defaultTtlMs: DEFAULT_TTL_MS,
  beforeCreate: invalidateUnusedTokensForEmail,
});
