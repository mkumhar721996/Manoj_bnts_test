const SEED_CATALOG = [
  {
    id: 'diavola',
    name: 'Diavola',
    price: '$16.50',
    description:
      'Spicy calabrian salami, house-pulled fresh mozzarella, san marzano tomato base, organic chili oil, fresh basil leaves.',
    image: '/images/pizzas/diavola.png',
    featured: true,
  },
  {
    id: 'funghi-selvatici-tartufo',
    name: 'Funghi Selvatici & Tartufo',
    price: '$18.00',
    description:
      'Roasted wild porcini and cremini mushrooms, truffle-infused olive oil, white mozzarella base, shaved pecorino.',
    image: '/images/pizzas/funghi-selvatici-tartufo.png',
    featured: true,
  },
  {
    id: 'classic-margherita',
    name: 'Classic Margherita',
    price: '$14.50',
    description:
      'Imported San Marzano tomato sauce, fresh buffalo mozzarella, fragrant fresh basil, extra virgin olive oil.',
    image: '/images/pizzas/classic-margherita.png',
    featured: true,
  },
  {
    id: 'prosciutto-crudo-e-rucola',
    name: 'Prosciutto Crudo e Rucola',
    price: '$19.00',
    description:
      'Prosciutto di Parma cured ham, fresh peppery wild arugula, shaved parmigiano-reggiano, balsamic glaze reduction.',
    image: '/images/pizzas/prosciutto-crudo.png',
    featured: true,
  },
  {
    id: 'quattro-formaggi',
    name: 'Quattro Formaggi',
    price: '$17.00',
    description: 'A blend of four Italian cheeses on a sourdough base.',
    image: '/images/pizzas/diavola.png',
    featured: false,
  },
];

let catalog = SEED_CATALOG;
let failureMode = null;

function reset() {
  catalog = SEED_CATALOG;
  failureMode = null;
}

function _setCatalog(list) {
  catalog = list;
}

function _setFailureMode(mode) {
  failureMode = mode;
}

function fetchFeatured() {
  if (failureMode === 'reject') {
    return Promise.reject(new Error('pizzaStore: simulated backend failure'));
  }
  if (failureMode === 'hang') {
    return new Promise(() => {});
  }
  return Promise.resolve(catalog.filter((pizza) => pizza.featured));
}

module.exports = { fetchFeatured, reset, _setCatalog, _setFailureMode };
