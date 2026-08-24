const crypto = require('crypto');

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

let tokens = new Map();

function reset() {
  tokens = new Map();
}

function create(email, ttlMs = DEFAULT_TTL_MS) {
  const token = crypto.randomUUID();
  tokens.set(token, {
    token,
    email: email.toLowerCase(),
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
  const record = tokens.get(token);
  if (record) {
    record.expiresAt = Date.now() - 1;
  }
}

module.exports = { create, findByToken, markUsed, expire, reset };
