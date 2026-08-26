const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderExpensesPage({ expenses = [], total = 0 } = {}) {
  const list =
    expenses.length === 0
      ? '<p id="empty-expenses">No expenses yet — add your first one</p>'
      : `<ul id="expense-list">${expenses
          .map(
            (expense) => `
      <li class="post">
        <div>
          <div class="post-author">${escapeHtml(expense.category)} — $${expense.amount.toFixed(2)}</div>
          <div class="post-meta">${escapeHtml(expense.date)}</div>
          ${expense.note ? `<p>${escapeHtml(expense.note)}</p>` : ''}
        </div>
      </li>`
          )
          .join('')}</ul>`;

  const body = `
<div class="status-screen">
  <div class="card">
    <h2>Expenses</h2>
    <p id="period-total">Total this period: $${total.toFixed(2)}</p>
    <a id="add-expense-action" href="/expenses/new">Add Expense</a>
    ${list}
  </div>
</div>
`;

  return renderLayout('Expenses', body);
}

module.exports = { renderExpensesPage };
