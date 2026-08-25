(function () {
  var TOAST_DURATION_MS = 3000;
  var cartCount = 0;

  var cartCountEl = document.getElementById('cartCount');
  var toastContainer = document.getElementById('toastContainer');
  var addButtons = document.querySelectorAll('.add-to-order-btn');

  function showToast(pizzaName) {
    if (!toastContainer) return;
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = 'Added to order: ' + pizzaName;
    toastContainer.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, TOAST_DURATION_MS);
  }

  addButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      cartCount += 1;
      if (cartCountEl) {
        cartCountEl.textContent = String(cartCount);
      }
      showToast(button.getAttribute('data-pizza-name'));
    });
  });
})();
