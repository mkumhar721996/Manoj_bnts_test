const crypto = require('crypto');

let orders = new Map();

function reset() {
  orders = new Map();
}

function create({ streetAddress, aptSuite, deliveryInstructions }) {
  const order = { id: crypto.randomUUID(), streetAddress, aptSuite, deliveryInstructions };
  orders.set(order.id, order);
  return order;
}

function findById(id) {
  return orders.get(id);
}

module.exports = { create, findById, reset };
