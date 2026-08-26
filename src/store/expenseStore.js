let expenses = [];

function reset() {
  expenses = [];
}

function save(expense) {
  expenses.unshift(expense);
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

function listForCurrentPeriod() {
  const period = currentPeriod();
  return expenses.filter((expense) => expense.date.slice(0, 7) === period);
}

function totalForCurrentPeriod() {
  return listForCurrentPeriod().reduce((sum, expense) => sum + expense.amount, 0);
}

module.exports = { save, reset, listForCurrentPeriod, totalForCurrentPeriod };
