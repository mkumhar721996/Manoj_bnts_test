const crypto = require('crypto');
const { expireTokenRecord } = require('../utils/expireTokenRecord');

const DEFAULT_TTL_MS = 4 * 60 * 60 * 1000;
const REMEMBER_ME_TTL_MS = 30 * 24 * 60 * 60 * 1000;

let sessions = new Map();

function reset() {
  sessions = new Map();
}

function create(userId, { rememberMe = false } = {}) {
  const token = crypto.randomUUID();
  const now = Date.now();
  const ttl = rememberMe ? REMEMBER_ME_TTL_MS : DEFAULT_TTL_MS;
  sessions.set(token, {
    userId,
    expiresAt: now + ttl,
  });
  return token;
}

function findUserId(token) {
  const record = sessions.get(token);
  return record ? record.userId : undefined;
}

function isValid(token) {
  const record = sessions.get(token);
  if (!record) {
    return false;
  }

  return Date.now() <= record.expiresAt;
}

function expire(token) {
  expireTokenRecord(sessions, token);
}

module.exports = { create, findUserId, isValid, expire, reset, REMEMBER_ME_TTL_MS };
