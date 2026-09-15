let addressesByUser = new Map();

function reset() {
  addressesByUser = new Map();
}

function list(userId) {
  return addressesByUser.get(userId) || [];
}

function findById(userId, id) {
  return list(userId).find((address) => address.id === id);
}

function save(userId, address) {
  const addresses = addressesByUser.get(userId) || [];
  addresses.push(address);
  addressesByUser.set(userId, addresses);
}

function replaceAll(userId, addresses) {
  addressesByUser.set(userId, addresses);
}

module.exports = { list, findById, save, replaceAll, reset };
