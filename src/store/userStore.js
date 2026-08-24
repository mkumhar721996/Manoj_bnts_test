let users = new Map();

function reset() {
  users = new Map();
}

function findByEmail(email) {
  return users.get(email.toLowerCase());
}

function save(user) {
  users.set(user.email.toLowerCase(), user);
}

module.exports = { findByEmail, save, reset };
