let expenses = [];

function reset() {
  expenses = [];
}

function save(expense) {
  expenses.unshift(expense);
}

function findById(id) {
  return expenses.find((expense) => expense.id === id);
}

function update(id, fields) {
  const expense = findById(id);
  if (!expense) {
    return undefined;
  }
  Object.assign(expense, fields);
  return expense;
}

function remove(id) {
  const index = expenses.findIndex((expense) => expense.id === id);
  if (index === -1) {
    return false;
  }
  expenses.splice(index, 1);
  return true;
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

module.exports = {
  save,
  reset,
  listForCurrentPeriod,
  totalForCurrentPeriod,
  findById,
  update,
  remove,
};
