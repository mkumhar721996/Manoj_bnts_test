let balances = new Map();

function reset() {
  balances = new Map();
}

function getBalance(userId) {
  return balances.get(userId) || 0;
}

function credit(userId, amount) {
  balances.set(userId, getBalance(userId) + amount);
}

function debit(userId, amount) {
  balances.set(userId, getBalance(userId) - amount);
}

module.exports = { reset, getBalance, credit, debit };
