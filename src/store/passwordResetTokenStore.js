const crypto = require('crypto');
const { expireTokenRecord } = require('../utils/expireTokenRecord');

const DEFAULT_TTL_MS = 60 * 60 * 1000;

let tokens = new Map();

function reset() {
  tokens = new Map();
}

function create(email, ttlMs = DEFAULT_TTL_MS) {
  const normalizedEmail = email.toLowerCase();

  for (const record of tokens.values()) {
    if (record.email === normalizedEmail && !record.used) {
      record.used = true;
    }
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

module.exports = { create, findByToken, markUsed, expire, reset };
