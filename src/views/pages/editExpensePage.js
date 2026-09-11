const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderEditExpensePage({ id, errors = [], values = {} } = {}) {
  const amount = values.amount !== undefined ? values.amount : '';
  const category = values.category !== undefined ? values.category : '';
  const date = values.date !== undefined ? values.date : '';
  const merchant = values.merchant !== undefined ? values.merchant : '';
  const note = values.note !== undefined ? values.note : '';

  const amountError = errors.includes('Amount is required.') ||
    errors.includes('Amount must be a positive number.');
  const categoryError = errors.includes('Category is required.');
  const dateError = errors.includes('Date is required.') ||
    errors.includes('Date must be a valid calendar date.');

  const body = `
<div class="status-screen">
  <form class="card" action="/expenses/${escapeHtml(id)}" method="post" novalidate>
    <h2>Edit Expense</h2>
    ${
      errors.length > 0
        ? `<div class="alert alert-danger"><ul>${errors
            .map((error) => `<li>${escapeHtml(error)}</li>`)
            .join('')}</ul></div>`
        : ''
    }

    <div class="field${amountError ? ' has-error' : ''}">
      <label for="expense-amount">Amount</label>
      <input
        type="text"
        id="expense-amount"
        name="amount"
        value="${escapeHtml(amount)}"
        ${amountError ? 'aria-invalid="true" aria-describedby="expense-amount-error"' : ''}
      >
      ${amountError ? `<p class="field-error" id="expense-amount-error">${escapeHtml(errors.find((error) => error.startsWith('Amount')))}</p>` : ''}
    </div>

    <div class="field${categoryError ? ' has-error' : ''}">
      <label for="expense-category">Category</label>
      <input
        type="text"
        id="expense-category"
        name="category"
        value="${escapeHtml(category)}"
        ${categoryError ? 'aria-invalid="true" aria-describedby="expense-category-error"' : ''}
      >
      ${categoryError ? '<p class="field-error" id="expense-category-error">Category is required.</p>' : ''}
    </div>

    <div class="field${dateError ? ' has-error' : ''}">
      <label for="expense-date">Date</label>
      <input
        type="date"
        id="expense-date"
        name="date"
        value="${escapeHtml(date)}"
        ${dateError ? 'aria-invalid="true" aria-describedby="expense-date-error"' : ''}
      >
      ${dateError ? `<p class="field-error" id="expense-date-error">${escapeHtml(errors.find((error) => error.startsWith('Date')))}</p>` : ''}
    </div>

    <div class="field">
      <label for="expense-merchant">Merchant</label>
      <input
        type="text"
        id="expense-merchant"
        name="merchant"
        value="${escapeHtml(merchant)}"
      >
    </div>

    <div class="field">
      <label for="expense-note">Note</label>
      <textarea id="expense-note" name="note">${escapeHtml(note)}</textarea>
    </div>

    <p class="loading-indicator" id="save-loading-indicator" hidden role="status" aria-live="polite">Saving…</p>
    <button class="btn btn-brand btn-block" type="submit" id="save-expense-action">Save Expense</button>
  </form>
  <a class="back-link" href="/expenses">Back to expenses</a>
</div>
<script>
  (function () {
    var form = document.querySelector('form[action="/expenses/${escapeHtml(id)}"]');
    if (!form) { return; }
    form.addEventListener('submit', function () {
      var indicator = document.getElementById('save-loading-indicator');
      var button = document.getElementById('save-expense-action');
      if (indicator) { indicator.hidden = false; }
      if (button) { button.disabled = true; }
    });
  })();
</script>
`;

  return renderLayout('Edit Expense', body);
}

module.exports = { renderEditExpensePage };
