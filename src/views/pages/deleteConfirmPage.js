const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderDeleteConfirmPage({ expense } = {}) {
  const body = `
<div class="status-screen">
  <div class="card">
    <h2>Delete Expense</h2>
    <p>Are you sure you want to delete this expense? This cannot be undone.</p>
    <div class="post">
      <div>
        <div class="post-author">${escapeHtml(expense.category)} — $${expense.amount.toFixed(2)}</div>
        <div class="post-meta">${escapeHtml(expense.date)}</div>
        ${expense.merchant ? `<p>${escapeHtml(expense.merchant)}</p>` : ''}
        ${expense.note ? `<p>${escapeHtml(expense.note)}</p>` : ''}
      </div>
    </div>

    <form action="/expenses/${escapeHtml(expense.id)}/delete" method="post">
      <p class="loading-indicator" id="delete-loading-indicator" hidden>Deleting…</p>
      <button class="btn btn-danger btn-block" type="submit" id="confirm-delete-action">Delete Expense</button>
    </form>
    <a class="back-link" id="cancel-delete-action" href="/expenses">Cancel</a>
  </div>
</div>
<script>
  (function () {
    var form = document.querySelector('form[action="/expenses/${escapeHtml(expense.id)}/delete"]');
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

  return renderLayout('Delete Expense', body);
}

module.exports = { renderDeleteConfirmPage };
