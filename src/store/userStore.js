let users = new Map();

function reset() {
  users = new Map();
}

function findByEmail(email) {
  return users.get(email.toLowerCase());
}

function findById(id) {
  for (const user of users.values()) {
    if (user.id === id) {
      return user;
    }
  }
  return undefined;
}

function save(user) {
  const key = user.email || user.phone;
  users.set(key.toLowerCase(), user);
}

function findByIdentifier(identifier) {
  return users.get(identifier.toLowerCase());
}

module.exports = { findByEmail, findById, findByIdentifier, save, reset };
