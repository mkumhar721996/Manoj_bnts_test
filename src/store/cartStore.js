let items = new Map();

function reset() {
  items = new Map();
}

function addItem(itemId, name, price) {
  const existing = items.get(itemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    items.set(itemId, { itemId, name, price, quantity: 1 });
  }
}

function removeItem(itemId) {
  items.delete(itemId);
}

function getItems() {
  return Array.from(items.values());
}

function getDistinctCount() {
  return items.size;
}

module.exports = { addItem, removeItem, getItems, getDistinctCount, reset };
