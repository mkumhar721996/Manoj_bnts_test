const SEED_ITEMS = [
  {
    id: 'classic-margherita',
    name: 'Classic Margherita',
    variant: 'Neapolitan Woodfired',
    unitPriceCents: 1450,
    quantity: 2,
  },
  {
    id: 'diavola',
    name: 'Diavola',
    variant: 'Neapolitan Woodfired',
    unitPriceCents: 1650,
    quantity: 1,
  },
  {
    id: 'rosemary-garlic-focaccia',
    name: 'Rosemary Garlic Focaccia',
    variant: 'Neapolitan Woodfired',
    unitPriceCents: 850,
    quantity: 1,
  },
];

let items = SEED_ITEMS.map((item) => ({ ...item }));

function reset() {
  items = SEED_ITEMS.map((item) => ({ ...item }));
}

function getItems() {
  return items;
}

function incrementQuantity(itemId) {
  const item = items.find((it) => it.id === itemId);
  if (item) {
    item.quantity += 1;
  }
}

function decrementQuantity(itemId) {
  const item = items.find((it) => it.id === itemId);
  if (item && item.quantity > 1) {
    item.quantity -= 1;
  }
}

function removeItem(itemId) {
  items = items.filter((it) => it.id !== itemId);
}

module.exports = {
  getItems,
  incrementQuantity,
  decrementQuantity,
  removeItem,
  reset,
};
