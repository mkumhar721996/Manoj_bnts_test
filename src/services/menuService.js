const pizzaStore = require('../store/pizzaStore');

const FEATURED_FETCH_TIMEOUT_MS = 3000;
const MAX_FEATURED_PIZZAS = 4;

function getFeaturedPizzas() {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error('menuService: featured pizzas fetch timed out')),
      FEATURED_FETCH_TIMEOUT_MS
    );
  });

  return Promise.race([pizzaStore.fetchFeatured(), timeout]).then(
    (pizzas) => {
      clearTimeout(timer);
      return pizzas.slice(0, MAX_FEATURED_PIZZAS);
    },
    (error) => {
      clearTimeout(timer);
      throw error;
    }
  );
}

module.exports = { getFeaturedPizzas, FEATURED_FETCH_TIMEOUT_MS, MAX_FEATURED_PIZZAS };
