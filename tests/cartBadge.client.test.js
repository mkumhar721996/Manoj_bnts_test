/** @jest-environment jsdom */

const { refreshCartBadge } = require('../public/js/cart-badge');

function setBadgeHtml(count, hidden) {
  document.body.innerHTML = `
    <a class="cart-indicator-btn" href="/cart">
      <span id="cart-badge"${hidden ? ' hidden' : ''}>${count}</span>
    </a>
  `;
}

beforeEach(() => {
  setBadgeHtml(0, true);
  global.fetch = jest.fn();
});

describe('AC8: cart badge updates in place without a full page reload', () => {
  it('updates the badge text and reveals it when the cart gains items', async () => {
    global.fetch.mockResolvedValue({ json: async () => ({ count: 3 }) });

    await refreshCartBadge();

    const badge = document.getElementById('cart-badge');
    expect(badge.textContent).toBe('3');
    expect(badge.hasAttribute('hidden')).toBe(false);
  });

  it('hides the badge again when the cart returns to zero', async () => {
    setBadgeHtml(3, false);
    global.fetch.mockResolvedValue({ json: async () => ({ count: 0 }) });

    await refreshCartBadge();

    const badge = document.getElementById('cart-badge');
    expect(badge.textContent).toBe('0');
    expect(badge.hasAttribute('hidden')).toBe(true);
  });

  it('refreshes automatically when a cart:changed event is dispatched', async () => {
    global.fetch.mockResolvedValue({ json: async () => ({ count: 5 }) });

    document.dispatchEvent(new CustomEvent('cart:changed'));
    await Promise.resolve();
    await Promise.resolve();

    const badge = document.getElementById('cart-badge');
    expect(badge.textContent).toBe('5');
    expect(badge.hasAttribute('hidden')).toBe(false);
  });
});
