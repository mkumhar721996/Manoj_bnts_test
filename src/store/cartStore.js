let count = 0;

function reset() {
  count = 0;
}

function getCount() {
  return count;
}

function addItem(quantity = 1) {
  count += quantity;
  return count;
}

module.exports = { getCount, addItem, reset };
