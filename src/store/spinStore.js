let spins = new Map();

function reset() {
  spins = new Map();
}

function create({ id, userId, amount }) {
  const record = { id, userId, amount, status: 'pending' };
  spins.set(id, record);
  return record;
}

function get(id) {
  return spins.get(id);
}

function markResolved(id) {
  const record = spins.get(id);
  if (record) {
    record.status = 'resolved';
  }
}

function markRefunded(id) {
  const record = spins.get(id);
  if (record) {
    record.status = 'refunded';
  }
}

module.exports = { reset, create, get, markResolved, markRefunded };
