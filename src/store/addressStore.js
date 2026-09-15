let addresses = [];

function reset() {
  addresses = [];
}

function save(address) {
  addresses.unshift(address);
}

function findById(id) {
  return addresses.find((address) => address.id === id);
}

function listForUser(userId) {
  return addresses.filter((address) => address.userId === userId);
}

function remove(id) {
  const index = addresses.findIndex((address) => address.id === id);
  if (index === -1) {
    return false;
  }
  addresses.splice(index, 1);
  return true;
}

module.exports = {
  save,
  reset,
  findById,
  listForUser,
  remove,
};
