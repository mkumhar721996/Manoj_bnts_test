const crypto = require('crypto');
const { expireTokenRecord } = require('../utils/expireTokenRecord');

const DEFAULT_TTL_MS = 4 * 60 * 60 * 1000;
const REMEMBER_ME_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

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
    lastActiveAt: now,
  });
  return token;
}

function findUserId(token) {
  const record = sessions.get(token);
  return record ? record.userId : undefined;
}

function isActive(token) {
  const record = sessions.get(token);
  if (!record) {
    return false;
  }

  const now = Date.now();
  return now <= record.expiresAt && now - record.lastActiveAt <= IDLE_TIMEOUT_MS;
}

function isValid(token) {
  const record = sessions.get(token);
  if (!record) {
    return false;
  }

  return Date.now() <= record.expiresAt;
}

function touch(token) {
  const record = sessions.get(token);
  if (record) {
    record.lastActiveAt = Date.now();
  }
}

function expire(token) {
  expireTokenRecord(sessions, token);
}

module.exports = { create, findUserId, isActive, isValid, touch, expire, reset, REMEMBER_ME_TTL_MS };
