import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialTransaction, TransactionType, TransactionStatus } from './entities/financial-transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(FinancialTransaction)
    private transactionRepository: Repository<FinancialTransaction>,
  ) {}

  async createTransaction(createDto: CreateTransactionDto): Promise<FinancialTransaction> {
    const transaction = this.transactionRepository.create(createDto);
    return this.transactionRepository.save(transaction);
  }

  async createExpense(createDto: CreateTransactionDto): Promise<FinancialTransaction> {
    createDto.type = TransactionType.EXPENSE;
    createDto.status = TransactionStatus.COMPLETED; // Expenses are usually recorded as completed
    return this.createTransaction(createDto);
  }

  async requestWithdrawal(userId: string, amount: number): Promise<FinancialTransaction> {
    const balance = await this.getUserBalance(userId);
    if (balance < amount) {
      throw new Error('Insufficient balance');
    }

    const transaction = this.transactionRepository.create({
      type: TransactionType.WITHDRAWAL,
      amount: amount,
      fromUserId: userId,
      status: TransactionStatus.PENDING,
      description: 'Withdrawal request',
    });
    return this.transactionRepository.save(transaction);
  }

  async findAll(): Promise<FinancialTransaction[]> {
    return this.transactionRepository.find({ order: { transactionDate: 'DESC' } });
  }

  // Get User Transactions (Where user is sender OR receiver)
  async getUserTransactions(userId: string): Promise<FinancialTransaction[]> {
    return this.transactionRepository.find({
      where: [
        { fromUserId: userId },
        { toUserId: userId },
      ],
      order: { transactionDate: 'DESC' },
    });
  }

  // Calculate User Balance (In - Out)
  async getUserBalance(userId: string): Promise<number> {
    const transactions = await this.getUserTransactions(userId);
    let balance = 0.0;

    for (const tx of transactions) {
      // Only count completed transactions or pending withdrawals (as frozen) logic can vary
      // For simplicity: Balance = Completed Incoming - Completed Outgoing - Pending Withdrawals
      
      if (tx.status === TransactionStatus.FAILED || tx.status === TransactionStatus.CANCELLED) continue;

      // Income
      if (tx.toUserId === userId && tx.status === TransactionStatus.COMPLETED) {
        balance += Number(tx.amount);
      }
      
      // Outgoing (including pending withdrawals to freeze amount)
      if (tx.fromUserId === userId && (tx.status === TransactionStatus.COMPLETED || tx.type === TransactionType.WITHDRAWAL)) {
        balance -= Number(tx.amount);
      }
    }
    return balance;
  }

  // Dashboard Stats (Admin view usually, or general stats)
  async getDashboardStats() {
    const totalSales = await this.sumAmountByType(TransactionType.SALE);
    const totalRentals = await this.sumAmountByType(TransactionType.RENT);
    const totalCommission = await this.sumCommission(); 
    const totalTax = await this.sumTax();
    const totalExpenses = await this.sumAmountByType(TransactionType.EXPENSE);

    // Net Profit = (Commission + Other Revenue) - Expenses
    // Assuming Commission is the main revenue source for the platform
    const netProfit = totalCommission - totalExpenses;

    return {
      totalSales,
      totalRentals,
      totalCommission,
      totalTax,
      totalExpenses,
      netProfit,
    };
  }

  async getCommissions() {
      // Aggregate commissions by status or time
      // This is a placeholder for more complex aggregation if needed
      const commissions = await this.transactionRepository.find({
          where: { type: TransactionType.COMMISSION },
          order: { transactionDate: 'DESC' }
      });
      return commissions;
  }

  private async sumAmountByType(type: TransactionType): Promise<number> {
    const { sum } = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'sum')
      .where('tx.type = :type', { type })
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();
    return Number(sum) || 0;
  }

  private async sumCommission(): Promise<number> {
    const { sum } = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.commissionAmount)', 'sum')
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();
    return Number(sum) || 0;
  }

  private async sumTax(): Promise<number> {
    const { sum } = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.taxAmount)', 'sum')
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();
    return Number(sum) || 0;
  }
}
