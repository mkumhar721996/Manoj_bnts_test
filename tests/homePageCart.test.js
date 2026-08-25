/** @jest-environment jsdom */
const path = require('path');
const { renderHomePage } = require('../src/views/pages/homePage');

function loadPageIntoDom() {
  const html = renderHomePage();
  document.open();
  document.write(html);
  document.close();
}

// cart.js is a plain script (no module exports) that attaches document-level
// click/keydown listeners as a side effect of being required. jest.isolateModules
// re-runs that side effect fresh each test so the module-scoped `cart` array starts
// empty, but the listeners it registers would otherwise pile up on the single jsdom
// `document` Jest reuses across tests in this file. Track and remove exactly the
// listeners this load attaches so each test starts with a clean slate.
function loadCartScript() {
  const attachedListeners = [];
  const originalAddEventListener = document.addEventListener.bind(document);
  document.addEventListener = (...args) => {
    attachedListeners.push(args);
    originalAddEventListener(...args);
  };

  try {
    jest.isolateModules(() => {
      require(path.join(__dirname, '..', 'public', 'js', 'cart.js'));
    });
  } finally {
    document.addEventListener = originalAddEventListener;
  }

  return attachedListeners;
}

function clickAddToOrder(itemId) {
  const button = document.querySelector(`[data-action="add-to-order"][data-item-id="${itemId}"]`);
  button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

let activeListeners = [];

beforeEach(() => {
  jest.resetModules();
  loadPageIntoDom();
  activeListeners = loadCartScript();
});

afterEach(() => {
  activeListeners.forEach((args) => document.removeEventListener(...args));
  activeListeners = [];
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

  it('does not re-add the item when clicking its rendered line item in an open cart panel', () => {
    clickAddToOrder('diavola');

    const cartButton = document.getElementById('cart-button');
    cartButton.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    const lineItem = document.querySelector('#cart-line-items li[data-item-id="diavola"]');
    lineItem.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    const lineItems = document.querySelectorAll('#cart-line-items li');
    expect(lineItems.length).toBe(1);
    expect(lineItems[0].textContent).not.toContain('x2');
    expect(document.getElementById('cart-badge').textContent).toBe('1');
  });
});

describe('MT-STORY-026: cart panel disclosure toggle', () => {
  function cartButton() {
    return document.getElementById('cart-button');
  }

  function cartPanel() {
    return document.getElementById('cart-panel');
  }

  it('starts closed with aria-expanded false and no is-open class', () => {
    expect(cartButton().getAttribute('aria-expanded')).toBe('false');
    expect(cartPanel().classList.contains('is-open')).toBe(false);
  });

  it('opens the cart panel and flips aria-expanded when the cart button is clicked', () => {
    cartButton().dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    expect(cartPanel().classList.contains('is-open')).toBe(true);
    expect(cartButton().getAttribute('aria-expanded')).toBe('true');
  });

  it('closes the cart panel when the cart button is clicked again', () => {
    cartButton().dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    cartButton().dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    expect(cartPanel().classList.contains('is-open')).toBe(false);
    expect(cartButton().getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the cart panel when clicking outside of it', () => {
    cartButton().dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    expect(cartPanel().classList.contains('is-open')).toBe(false);
    expect(cartButton().getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the cart panel when Escape is pressed', () => {
    cartButton().dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(cartPanel().classList.contains('is-open')).toBe(false);
    expect(cartButton().getAttribute('aria-expanded')).toBe('false');
  });
});
