const walletStore = require('../src/store/walletStore');
const spinStore = require('../src/store/spinStore');
const spinService = require('../src/services/spinService');

beforeEach(() => {
  walletStore.reset();
  spinStore.reset();
});

describe('AC1: failed resolution immediately credits the full wager back', () => {
  it('refunds the wager when the spin outcome cannot be resolved', async () => {
    walletStore.credit('user-1', 500);

    const result = await spinService.placeSpin({
      userId: 'user-1',
      amount: 100,
      resolveOutcome: () => Promise.reject(new Error('game engine error')),
    });

    expect(result.status).toBe('refunded');
    expect(walletStore.getBalance('user-1')).toBe(500);
  });
});

describe('AC2: balance after refund equals the pre-bet balance exactly', () => {
  it('restores the balance to what it was before the spin as if it never occurred', async () => {
    walletStore.credit('user-1', 500);
    const preBetBalance = walletStore.getBalance('user-1');

    await spinService.placeSpin({
      userId: 'user-1',
      amount: 250,
      resolveOutcome: () => Promise.reject(new Error('timeout')),
    });

    expect(walletStore.getBalance('user-1')).toBe(preBetBalance);
  });
});

describe('AC3: after refund, the full balance is available for wagering with nothing held', () => {
  it('allows the entire refunded balance to be wagered again immediately', async () => {
    walletStore.credit('user-1', 300);

    await spinService.placeSpin({
      userId: 'user-1',
      amount: 300,
      resolveOutcome: () => Promise.reject(new Error('game engine error')),
    });

    expect(walletStore.getBalance('user-1')).toBe(300);

    const secondSpin = await spinService.placeSpin({
      userId: 'user-1',
      amount: 300,
      resolveOutcome: () => Promise.resolve('win'),
    });

    expect(secondSpin.status).toBe('resolved');
    expect(walletStore.getBalance('user-1')).toBe(0);
  });
});

describe('AC4: a spin already refunded is never refunded a second time', () => {
  it('does not credit the wager again when the failure is detected again for the same spin', async () => {
    walletStore.credit('user-1', 500);

    const { spinId } = await spinService.placeSpin({
      userId: 'user-1',
      amount: 100,
      resolveOutcome: () => Promise.reject(new Error('game engine error')),
    });

    expect(walletStore.getBalance('user-1')).toBe(500);

    spinService.refundSpin(spinId);
    expect(walletStore.getBalance('user-1')).toBe(500);

    spinService.refundSpin(spinId);
    expect(walletStore.getBalance('user-1')).toBe(500);
  });

  it('does not credit a spin that already resolved successfully', async () => {
    walletStore.credit('user-1', 400);

    const { spinId } = await spinService.placeSpin({
      userId: 'user-1',
      amount: 400,
      resolveOutcome: () => Promise.resolve('win'),
    });

    expect(walletStore.getBalance('user-1')).toBe(0);

    spinService.refundSpin(spinId);
    expect(walletStore.getBalance('user-1')).toBe(0);
  });
});
