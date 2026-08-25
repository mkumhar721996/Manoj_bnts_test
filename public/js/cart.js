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

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-item-id]');
    if (!button) {
      return;
    }
    addItem(
      button.getAttribute('data-item-id'),
      button.getAttribute('data-item-name'),
      button.getAttribute('data-item-price')
    );
    render();
  });

  render();
})();
