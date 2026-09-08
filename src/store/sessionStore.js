const crypto = require('crypto');
const { expireTokenRecord } = require('../utils/expireTokenRecord');

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

let sessions = new Map();

function reset() {
  sessions = new Map();
}

function create(userId) {
  const token = crypto.randomUUID();
  const now = Date.now();
  sessions.set(token, {
    userId,
    expiresAt: now + SESSION_TTL_MS,
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

function touch(token) {
  const record = sessions.get(token);
  if (record) {
    record.lastActiveAt = Date.now();
  }
}

function expire(token) {
  expireTokenRecord(sessions, token);
}

// Only meaningful to call after isActive(token) has already returned false;
// gives middleware enough detail (without touching state) to log *why* a
// session was rejected instead of redirecting silently.
function describeRejection(token) {
  if (!token) {
    return { reason: 'missing', userId: undefined };
  }

  const record = sessions.get(token);
  if (!record) {
    return { reason: 'missing', userId: undefined };
  }

  const now = Date.now();
  if (now > record.expiresAt) {
    return { reason: 'expired', userId: record.userId };
  }
  if (now - record.lastActiveAt > IDLE_TIMEOUT_MS) {
    return { reason: 'idle', userId: record.userId };
  }
  return { reason: 'active', userId: record.userId };
}

module.exports = { create, findUserId, isActive, touch, expire, reset, describeRejection };
