const crypto = require('crypto');
const userStore = require('../src/store/userStore');
const walletService = require('../src/services/walletService');

function seedUser(balance) {
  const user = { id: crypto.randomUUID(), email: `${crypto.randomUUID()}@example.com`, balance };
  userStore.save(user);
  return user;
}

beforeEach(() => {
  userStore.reset();
});

describe('AC1: winning outcome credits the correct integer payout immediately', () => {
  it('increases the balance by betAmount * multiplier as soon as the outcome is applied', () => {
    const user = seedUser(100);

    const result = walletService.applyOutcome(user.id, { won: true, betAmount: 20, multiplier: 3 });

    expect(result).toEqual({ balance: 160, payout: 60 });
    expect(userStore.findById(user.id).balance).toBe(160);
  });
});

describe('AC2: losing outcome leaves the post-deduction balance unchanged', () => {
  it('returns a zero payout and does not credit the balance', () => {
    const user = seedUser(80);

    const result = walletService.applyOutcome(user.id, { won: false, betAmount: 20, multiplier: 0 });

    expect(result).toEqual({ balance: 80, payout: 0 });
    expect(userStore.findById(user.id).balance).toBe(80);
  });
});

describe('AC3: payout calculation never produces or stores a fractional credit', () => {
  it('floors a fractional payout instead of rounding it', () => {
    const user = seedUser(0);

    const result = walletService.applyOutcome(user.id, { won: true, betAmount: 7, multiplier: 1.5 });

    expect(result.payout).toBe(10);
    expect(Number.isInteger(result.payout)).toBe(true);
    expect(Number.isInteger(userStore.findById(user.id).balance)).toBe(true);
    expect(userStore.findById(user.id).balance).toBe(10);
  });

  it('leaves an already-integer payout unchanged', () => {
    const user = seedUser(0);

    const result = walletService.applyOutcome(user.id, { won: true, betAmount: 10, multiplier: 2 });

    expect(result.payout).toBe(20);
    expect(userStore.findById(user.id).balance).toBe(20);
  });
});
