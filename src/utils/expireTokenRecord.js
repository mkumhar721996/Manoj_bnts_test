function expireTokenRecord(store, token) {
  const record = store.get(token);
  if (record) {
    record.expiresAt = Date.now() - 1;
  }
}

module.exports = { expireTokenRecord };
