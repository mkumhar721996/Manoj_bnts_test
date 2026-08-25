let carts = new Map();

function reset() {
  carts = new Map();
}

function getCount(cartId) {
  return carts.get(cartId) || 0;
}

function addItem(cartId, quantity = 1) {
  const count = getCount(cartId) + quantity;
  carts.set(cartId, count);
  return count;
}

module.exports = { getCount, addItem, reset };
