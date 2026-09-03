const userStore = require('../store/userStore');

function applyOutcome(userId, outcome) {
  const user = userStore.findById(userId);

  if (!outcome.won) {
    return { balance: user.balance, payout: 0 };
  }

  const payout = Math.floor(outcome.betAmount * outcome.multiplier);
  user.balance += payout;
  userStore.save(user);

  return { balance: user.balance, payout };
}

module.exports = { applyOutcome };
