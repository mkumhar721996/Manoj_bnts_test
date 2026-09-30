const crypto = require('crypto');
const { expireTokenRecord } = require('../utils/expireTokenRecord');

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

let otps = new Map();

function reset() {
  otps = new Map();
}

function key(identifier, purpose) {
  return `${purpose}:${identifier.toLowerCase()}`;
}

function create(identifier, purpose, type) {
  const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  otps.set(key(identifier, purpose), {
    code,
    type,
    purpose,
    expiresAt: Date.now() + OTP_TTL_MS,
    used: false,
    attempts: 0,
  });
  return code;
}

function find(identifier, purpose) {
  return otps.get(key(identifier, purpose));
}

function markUsed(identifier, purpose) {
  const record = find(identifier, purpose);
  if (record) {
    record.used = true;
  }
}

function expire(identifier, purpose) {
  expireTokenRecord(otps, key(identifier, purpose));
}

function recordFailedAttempt(identifier, purpose) {
  const record = find(identifier, purpose);
  if (record) {
    record.attempts += 1;
  }
}

function isLocked(identifier, purpose) {
  const record = find(identifier, purpose);
  return Boolean(record && record.attempts >= MAX_ATTEMPTS);
}

module.exports = { create, find, markUsed, expire, reset, recordFailedAttempt, isLocked };
