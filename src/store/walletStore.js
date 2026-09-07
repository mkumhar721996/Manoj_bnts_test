let balances = new Map();

function reset() {
  balances = new Map();
}

function getBalance(userId) {
  return balances.get(userId) || 0;
}

function credit(userId, amount) {
  const balance = getBalance(userId) + amount;
  balances.set(userId, balance);
  console.info('walletStore.credit', { userId, amount, balance });
}

function debit(userId, amount) {
  const balance = getBalance(userId) - amount;
  balances.set(userId, balance);
  console.info('walletStore.debit', { userId, amount, balance });
}

module.exports = { reset, getBalance, credit, debit };
