(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  async function refreshCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) {
      return;
    }

    let count;
    try {
      const response = await fetch('/api/cart');
      ({ count } = await response.json());
    } catch (error) {
      console.error('Failed to refresh cart badge:', error);
      return;
    }

    badge.textContent = String(count);
    if (count === 0) {
      badge.setAttribute('hidden', '');
    } else {
      badge.removeAttribute('hidden');
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', refreshCartBadge);
    document.addEventListener('cart:changed', refreshCartBadge);
  }

  return { refreshCartBadge };
});
