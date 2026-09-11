const expenseStore = require('../store/expenseStore');

function requireExpense(req, res, next) {
  const expense = expenseStore.findById(req.params.id);

  if (!expense) {
    console.info(
      `[expenses] not found: id=${req.params.id} method=${req.method} path=${req.originalUrl}`
    );
    return res.status(404).end();
  }

  req.expense = expense;
  next();
}

module.exports = requireExpense;
