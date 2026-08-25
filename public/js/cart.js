(function () {
  var cart = [];

  function addItem(id, name, price) {
    var existing = cart.find(function (line) {
      return line.id === id;
    });
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: id, name: name, price: price, quantity: 1 });
    }
  }

  function totalQuantity() {
    return cart.reduce(function (sum, line) {
      return sum + line.quantity;
    }, 0);
  }

  function render() {
    var badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = String(totalQuantity());
    }

    var list = document.getElementById('cart-line-items');
    var emptyMessage = document.getElementById('cart-empty-message');
    if (!list) {
      return;
    }

    list.textContent = '';
    cart.forEach(function (line) {
      var li = document.createElement('li');
      li.setAttribute('data-item-id', line.id);
      li.textContent = line.name + ' x' + line.quantity + ' — ' + line.price;
      list.appendChild(li);
    });

    if (emptyMessage) {
      emptyMessage.style.display = cart.length === 0 ? '' : 'none';
    }
  }

  function setPanelOpen(open) {
    var panel = document.getElementById('cart-panel');
    var button = document.getElementById('cart-button');
    if (!panel || !button) {
      return;
    }
    panel.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
  }

  function isPanelOpen() {
    var panel = document.getElementById('cart-panel');
    return !!panel && panel.classList.contains('is-open');
  }

  document.addEventListener('click', function (event) {
    var addToOrderButton = event.target.closest('[data-item-id]');
    if (addToOrderButton) {
      addItem(
        addToOrderButton.getAttribute('data-item-id'),
        addToOrderButton.getAttribute('data-item-name'),
        addToOrderButton.getAttribute('data-item-price')
      );
      render();
      return;
    }

    var cartButton = event.target.closest('#cart-button');
    if (cartButton) {
      setPanelOpen(!isPanelOpen());
      return;
    }

    var cartPanel = event.target.closest('#cart-panel');
    if (!cartPanel && isPanelOpen()) {
      setPanelOpen(false);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isPanelOpen()) {
      setPanelOpen(false);
    }
  });

  render();
})();
