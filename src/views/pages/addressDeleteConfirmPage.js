const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderAddressDeleteConfirmPage({ address } = {}) {
  const body = `
<div class="status-screen">
  <div class="card">
    <h2>Delete Address</h2>
    <p>Are you sure you want to delete this address? This cannot be undone.</p>
    <div class="post">
      <div>
        <div class="post-author">${escapeHtml(address.streetAddress)}</div>
        ${address.aptSuite ? `<p>${escapeHtml(address.aptSuite)}</p>` : ''}
        ${address.deliveryInstructions ? `<p>${escapeHtml(address.deliveryInstructions)}</p>` : ''}
      </div>
    </div>

    <form action="/addresses/${escapeHtml(address.id)}/delete" method="post">
      <p class="loading-indicator" id="delete-loading-indicator" hidden role="status" aria-live="polite">Deleting…</p>
      <button class="btn btn-danger btn-block" type="submit" id="confirm-delete-action">Delete Address</button>
    </form>
    <a class="back-link" id="cancel-delete-action" href="/addresses">Cancel</a>
  </div>
</div>
<script>
  (function () {
    var form = document.querySelector('form[action="/addresses/${escapeHtml(address.id)}/delete"]');
    if (!form) { return; }
    form.addEventListener('submit', function () {
      var indicator = document.getElementById('delete-loading-indicator');
      var button = document.getElementById('confirm-delete-action');
      if (indicator) { indicator.hidden = false; }
      if (button) { button.disabled = true; }
    });
  })();
</script>
`;

  return renderLayout('Delete Address', body);
}

module.exports = { renderAddressDeleteConfirmPage };
