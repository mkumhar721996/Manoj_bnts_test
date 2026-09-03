const { createTokenStore } = require('./createTokenStore');

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

module.exports = createTokenStore({ defaultTtlMs: DEFAULT_TTL_MS });
