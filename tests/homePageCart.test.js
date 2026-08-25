/** @jest-environment jsdom */
const path = require('path');
const { renderHomePage } = require('../src/views/pages/homePage');

function loadPageIntoDom() {
  const html = renderHomePage();
  document.open();
  document.write(html);
  document.close();
}

function loadCartScript() {
  let cartModulePath;
  jest.isolateModules(() => {
    cartModulePath = require.resolve(path.join(__dirname, '..', 'public', 'js', 'cart.js'));
    require(cartModulePath);
  });
}

function clickAddToOrder(itemId) {
  const button = document.querySelector(`[data-item-id="${itemId}"]`);
  button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

beforeEach(() => {
  jest.resetModules();
  loadPageIntoDom();
  loadCartScript();
});

describe('MT-STORY-026 AC4: adding a new item to the cart', () => {
  it('starts with an empty cart and a badge of 0', () => {
    expect(document.getElementById('cart-badge').textContent).toBe('0');
    expect(document.querySelectorAll('#cart-line-items li').length).toBe(0);
  });

  it('creates a new line item and increments the badge when adding a new item', () => {
    clickAddToOrder('diavola');

    const lineItems = document.querySelectorAll('#cart-line-items li');
    expect(lineItems.length).toBe(1);
    expect(lineItems[0].getAttribute('data-item-id')).toBe('diavola');
    expect(lineItems[0].textContent).toContain('Diavola');
    expect(document.getElementById('cart-badge').textContent).toBe('1');
  });
});

describe('MT-STORY-026 AC5: adding an item already in the cart', () => {
  it('increments the existing line item quantity instead of duplicating it', () => {
    clickAddToOrder('diavola');
    clickAddToOrder('diavola');

    const lineItems = document.querySelectorAll('#cart-line-items li');
    expect(lineItems.length).toBe(1);
    expect(lineItems[0].textContent).toContain('2');
    expect(document.getElementById('cart-badge').textContent).toBe('2');
  });

  it('adds a distinct line item for a different pizza without merging quantities', () => {
    clickAddToOrder('diavola');
    clickAddToOrder('diavola');
    clickAddToOrder('margherita');

    const lineItems = document.querySelectorAll('#cart-line-items li');
    expect(lineItems.length).toBe(2);
    expect(document.getElementById('cart-badge').textContent).toBe('3');
  });
});
