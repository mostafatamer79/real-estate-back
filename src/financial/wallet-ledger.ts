import { FinancialTransaction, TransactionStatus, TransactionType } from './entities/financial-transaction.entity';

/** Externally funded purchases appear in history without spending stored wallet funds. */
export function walletBalance(transactions: FinancialTransaction[], userId: string): number {
  let cents = 0;
  for (const tx of transactions) {
    if (tx.referenceType === 'geidea_payment'
      || tx.status === TransactionStatus.FAILED || tx.status === TransactionStatus.CANCELLED) continue;
    const amount = Math.round(Number(tx.amount) * 100);
    if (tx.toUserId === userId && tx.status === TransactionStatus.COMPLETED) cents += amount;
    if (tx.fromUserId === userId
      && (tx.status === TransactionStatus.COMPLETED || tx.type === TransactionType.WITHDRAWAL)) cents -= amount;
  }
  return cents / 100;
}
