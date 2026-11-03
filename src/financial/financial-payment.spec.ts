import { FinancialService } from './financial.service';
import { PaymentMethod } from './entities/financial-transaction.entity';
import { InvoiceStatus } from './entities/invoice.entity';

describe('payment entry points', () => {
  const invoice = { id: 'invoice', userId: 'user', total: 10, status: InvoiceStatus.UNPAID };
  const makeService = (referenceType?: string) => new FinancialService(
    { find: async () => [], create: (x) => x, save: async (x) => x } as never,
    { findOne: async () => ({ ...invoice, referenceType }), save: async (x) => x } as never,
    {} as never, {} as never, {} as never, {} as never, {} as never, {} as never,
  );
  it('rejects card payments sent to the manual wallet payment endpoint', async () => {
    await expect(makeService().payInvoice('user', 'invoice', PaymentMethod.CARD)).rejects.toThrow('gateway');
  });
  it('does not let a top-up invoice be paid from the same wallet', async () => {
    await expect(makeService('GeideaWalletTopup').payInvoice('user', 'invoice', PaymentMethod.WALLET)).rejects.toThrow('gateway');
  });
  it.each([0, -10, NaN, Infinity])('rejects invalid withdrawal %s', async amount => {
    await expect(makeService().requestWithdrawal('user', amount)).rejects.toThrow('amount');
  });
});
