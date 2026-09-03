const crypto = require('crypto');
const { expireTokenRecord } = require('../utils/expireTokenRecord');

function createTokenStore({ defaultTtlMs, beforeCreate }) {
  let tokens = new Map();

  function reset() {
    tokens = new Map();
  }

  function create(email, ttlMs = defaultTtlMs) {
    const normalizedEmail = email.toLowerCase();

    if (beforeCreate) {
      beforeCreate(tokens, normalizedEmail);
    }

    const token = crypto.randomUUID();
    tokens.set(token, {
      token,
      email: normalizedEmail,
      expiresAt: Date.now() + ttlMs,
      used: false,
    });
    return token;
  }

  function findByToken(token) {
    return tokens.get(token);
  }

  function markUsed(token) {
    const record = tokens.get(token);
    if (record) {
      record.used = true;
    }
  }

  function expire(token) {
    expireTokenRecord(tokens, token);
  }

  return { create, findByToken, markUsed, expire, reset };
}

module.exports = { createTokenStore };
