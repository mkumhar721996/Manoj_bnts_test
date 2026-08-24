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

function findByVerificationToken(token) {
  for (const user of users.values()) {
    if (user.verificationToken === token) {
      return user;
    }
  }
  return undefined;
}

module.exports = { findByEmail, save, reset, findByVerificationToken };
