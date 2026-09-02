let users = new Map();
let usersById = new Map();

function reset() {
  users = new Map();
  usersById = new Map();
}

function findByEmail(email) {
  return users.get(email.toLowerCase());
}

function findById(id) {
  return usersById.get(id);
}

function save(user) {
  users.set(user.email.toLowerCase(), user);
  usersById.set(user.id, user);
}

module.exports = { findByEmail, findById, save, reset };
