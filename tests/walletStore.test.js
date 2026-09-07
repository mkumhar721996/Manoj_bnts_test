const walletStore = require('../src/store/walletStore');

beforeEach(() => {
  walletStore.reset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('wallet balance changes are logged for audit purposes', () => {
  it('logs the user id, amount, and resulting balance on credit', () => {
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    walletStore.credit('user-1', 200);

    expect(infoSpy).toHaveBeenCalledWith(
      'walletStore.credit',
      expect.objectContaining({ userId: 'user-1', amount: 200, balance: 200 })
    );
  });

  it('logs the user id, amount, and resulting balance on debit', () => {
    walletStore.credit('user-1', 500);
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    walletStore.debit('user-1', 150);

    expect(infoSpy).toHaveBeenCalledWith(
      'walletStore.debit',
      expect.objectContaining({ userId: 'user-1', amount: 150, balance: 350 })
    );
  });
});
