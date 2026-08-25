/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');
const { renderHomePage } = require('../src/views/pages/homePage');

const PIZZA_MENU_SOURCE = fs.readFileSync(
  path.join(__dirname, '../src/public/js/pizzaMenu.js'),
  'utf8'
);

const SAMPLE_PIZZAS = [
  {
    id: 'diavola',
    name: 'Diavola',
    price: '$16.50',
    description: 'Spicy calabrian salami.',
    image: '/images/pizzas/diavola.png',
    featured: true,
  },
  {
    id: 'classic-margherita',
    name: 'Classic Margherita',
    price: '$14.50',
    description: 'Imported San Marzano tomato sauce.',
    image: '/images/pizzas/classic-margherita.png',
    featured: true,
  },
];

function renderIntoDom() {
  document.documentElement.innerHTML = renderHomePage({ featuredPizzas: SAMPLE_PIZZAS });
  new Function(PIZZA_MENU_SOURCE)();
}

afterEach(() => {
  jest.useRealTimers();
});

describe('AC5: clicking Add to Order increments the cart badge and shows an auto-dismissing toast', () => {
  it('increments the badge immediately and removes the toast after the timeout', () => {
    jest.useFakeTimers();
    renderIntoDom();

    const button = document.querySelectorAll('.add-to-order-btn')[0];
    button.click();

    expect(document.getElementById('cartCount').textContent).toBe('1');

    const toasts = document.querySelectorAll('#toastContainer .toast');
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toContain('Diavola');

    jest.advanceTimersByTime(3000);

    expect(document.querySelectorAll('#toastContainer .toast').length).toBe(0);
  });
});

describe('AC6: cart badge reflects the cumulative total across different cards', () => {
  it('accumulates the count across clicks on different cards', () => {
    jest.useFakeTimers();
    renderIntoDom();

    const buttons = document.querySelectorAll('.add-to-order-btn');
    buttons[0].click();
    buttons[1].click();

    expect(document.getElementById('cartCount').textContent).toBe('2');

    const toasts = document.querySelectorAll('#toastContainer .toast');
    expect(toasts.length).toBe(2);
    expect(toasts[0].textContent).toContain('Diavola');
    expect(toasts[1].textContent).toContain('Classic Margherita');
  });
});
