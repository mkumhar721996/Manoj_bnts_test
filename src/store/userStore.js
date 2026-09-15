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

function findByPhone(phone) {
  for (const user of users.values()) {
    if (user.phone === phone) {
      return user;
    }
  }
  return undefined;
}

function save(user) {
  users.set(user.email.toLowerCase(), user);
}

module.exports = { findByEmail, findById, findByPhone, save, reset };
