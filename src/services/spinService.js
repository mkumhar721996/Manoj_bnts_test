const crypto = require('crypto');
const walletStore = require('../store/walletStore');
const spinStore = require('../store/spinStore');

async function placeSpin({ userId, amount, resolveOutcome }) {
  walletStore.debit(userId, amount);
  const id = crypto.randomUUID();
  spinStore.create({ id, userId, amount });

  try {
    const outcome = await resolveOutcome();
    spinStore.markResolved(id);
    return { spinId: id, status: 'resolved', outcome };
  } catch (err) {
    return { spinId: id, status: 'refunded' };
  }
}

function refundSpin(spinId) {
  const record = spinStore.get(spinId);
  if (!record || record.status === 'refunded') {
    return;
  }

  walletStore.credit(record.userId, record.amount);
  spinStore.markRefunded(spinId);
}

module.exports = { placeSpin, refundSpin };
