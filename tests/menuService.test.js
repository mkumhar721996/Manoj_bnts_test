const pizzaStore = require('../src/store/pizzaStore');
const menuService = require('../src/services/menuService');

afterEach(() => {
  pizzaStore.reset();
  jest.useRealTimers();
});

describe('AC4: getFeaturedPizzas rejects when the backend hangs past the timeout', () => {
  it('rejects once the fetch timeout elapses', async () => {
    jest.useFakeTimers();
    pizzaStore._setFailureMode('hang');

    const resultPromise = menuService.getFeaturedPizzas();
    const assertion = expect(resultPromise).rejects.toThrow();

    jest.advanceTimersByTime(menuService.FEATURED_FETCH_TIMEOUT_MS);

    await assertion;
  });
});
