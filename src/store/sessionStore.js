const crypto = require('crypto');

let sessions = new Map();

function reset() {
  sessions = new Map();
}

function create(userId) {
  const token = crypto.randomUUID();
  sessions.set(token, userId);
  return token;
}

function findUserId(token) {
  return sessions.get(token);
}

module.exports = { create, findUserId, reset };
