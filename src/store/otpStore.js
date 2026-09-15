const crypto = require('crypto');
const { expireTokenRecord } = require('../utils/expireTokenRecord');

const OTP_TTL_MS = 5 * 60 * 1000;

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

module.exports = { create, find, markUsed, expire, reset };
