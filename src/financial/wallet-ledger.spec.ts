import { walletBalance } from './wallet-ledger';

describe('wallet balance', () => {
  it('counts top-ups and wallet spending, without deducting externally paid invoices', () => {
    const rows = [
      { toUserId: 'customer', amount: 100, status: 'completed', type: 'deposit' },
      { fromUserId: 'customer', amount: 80, status: 'completed', type: 'expense', referenceType: 'geidea_payment' },
      { fromUserId: 'customer', amount: 30, status: 'completed', type: 'expense', paymentMethod: 'wallet' },
      { fromUserId: 'customer', amount: 20, status: 'pending', type: 'withdrawal' },
      { toUserId: 'customer', amount: 900, status: 'failed', type: 'deposit' },
    ];
    expect(walletBalance(rows as never, 'customer')).toBe(50);
  });
});
