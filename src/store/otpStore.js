const crypto = require('crypto');

let requests = new Map();

function reset() {
  requests = new Map();
}

function create({ orderId, name, phone, email }) {
  const code = crypto.randomInt(100000, 1000000).toString();
  const record = { orderId, name, phone, email, code, used: false };
  requests.set(orderId, record);
  return record;
}

function findByOrderId(orderId) {
  return requests.get(orderId);
}

function markUsed(orderId) {
  const record = requests.get(orderId);
  if (record) {
    record.used = true;
  }
}

module.exports = { create, findByOrderId, markUsed, reset };
