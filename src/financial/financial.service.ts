import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, ObjectLiteral } from 'typeorm';
import { FinancialTransaction, TransactionType, TransactionStatus } from './entities/financial-transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { Commission, CommissionStatus } from '../commission/commission.entity';
import { PaymentMethod } from './entities/financial-transaction.entity';
import { User } from '../user/user-entity';
import { Booking, BookingStatus } from '../booking/entities/booking.entity';
import { ServiceRequest, PaidStatus } from '../service/service-request.entity';

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(FinancialTransaction)
    private transactionRepository: Repository<FinancialTransaction>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Commission)
    private commissionRepository: Repository<Commission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
  ) {}

  private isAdmin(user: any): boolean {
    return user?.role === 'admin';
  }

  private async getScopedUserIds(user: any): Promise<string[]> {
    const userId = user?.userId || user?.id;
    if (!userId) return [];
    if (this.isAdmin(user)) return [];
    const managedUsers = await this.userRepository.find({
      where: { parentId: userId } as any,
      select: ['id'] as any,
    });
    return [userId, ...managedUsers.map((u) => u.id)];
  }

  private async applyTransactionScope<T extends ObjectLiteral>(query: SelectQueryBuilder<T>, alias: string, user: any) {
    if (this.isAdmin(user)) return query;
    const ids = await this.getScopedUserIds(user);
    if (!ids.length) {
      query.andWhere('1 = 0');
      return query;
    }
    query.andWhere(`(${alias}.fromUserId IN (:...scopedIds) OR ${alias}.toUserId IN (:...scopedIds))`, { scopedIds: ids });
    return query;
  }

  private async applyInvoiceScope<T extends ObjectLiteral>(query: SelectQueryBuilder<T>, alias: string, user: any) {
    if (this.isAdmin(user)) return query;
    const ids = await this.getScopedUserIds(user);
    if (!ids.length) {
      query.andWhere('1 = 0');
      return query;
    }
    query.andWhere(`${alias}.userId IN (:...scopedIds)`, { scopedIds: ids });
    return query;
  }

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

  async findAll(user: any): Promise<FinancialTransaction[]> {
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.fromUser', 'fromUser')
      .leftJoinAndSelect('tx.toUser', 'toUser')
      .orderBy('tx.transactionDate', 'DESC');
    await this.applyTransactionScope(query, 'tx', user);
    return query.getMany();
  }

  private escapeCsvValue(value: unknown) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    const escaped = str.replace(/"/g, '""');
    if (/[",\n\r]/.test(escaped)) return `"${escaped}"`;
    return escaped;
  }

  async exportTransactionsCsv(
    user: any,
    filters?: { type?: string; status?: string; startDate?: string; endDate?: string; search?: string },
  ): Promise<string> {
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.fromUser', 'fromUser')
      .leftJoinAndSelect('tx.toUser', 'toUser')
      .orderBy('tx.transactionDate', 'DESC');

    await this.applyTransactionScope(query, 'tx', user);

    if (filters?.type && filters.type !== 'all') {
      query.andWhere('tx.type = :type', { type: filters.type });
    }
    if (filters?.status && filters.status !== 'all') {
      query.andWhere('tx.status = :status', { status: filters.status });
    }
    if (filters?.startDate) {
      const start = new Date(filters.startDate);
      if (!isNaN(start.getTime())) query.andWhere('tx.transactionDate >= :start', { start: start.toISOString() });
    }
    if (filters?.endDate) {
      const end = new Date(filters.endDate);
      if (!isNaN(end.getTime())) query.andWhere('tx.transactionDate <= :end', { end: end.toISOString() });
    }
    if (filters?.search) {
      const search = `%${filters.search}%`;
      query.andWhere(
        `(
          tx.description ILIKE :search
          OR tx.referenceId ILIKE :search
          OR CAST(tx.id AS text) ILIKE :search
          OR fromUser.firstName ILIKE :search
          OR fromUser.lastName ILIKE :search
          OR toUser.firstName ILIKE :search
          OR toUser.lastName ILIKE :search
        )`,
        { search },
      );
    }

    const rows = await query.getMany();

    const headers = [
      'ID',
      'Reference',
      'Description',
      'Type',
      'Amount',
      'Status',
      'Payment Method',
      'From User',
      'To User',
      'Date',
    ];

    const lines = [
      headers.map((h) => this.escapeCsvValue(h)).join(','),
      ...rows.map((tx) => {
        const fromName = [tx.fromUser?.firstName, tx.fromUser?.lastName].filter(Boolean).join(' ');
        const toName = [tx.toUser?.firstName, tx.toUser?.lastName].filter(Boolean).join(' ');
        return [
          tx.id,
          (tx as any).referenceId || '',
          tx.description || '',
          tx.type || '',
          tx.amount ?? '',
          tx.status || '',
          (tx as any).paymentMethod || '',
          fromName,
          toName,
          tx.transactionDate ? new Date(tx.transactionDate).toISOString() : '',
        ]
          .map((v) => this.escapeCsvValue(v))
          .join(',');
      }),
    ];

    // BOM improves Arabic rendering in Excel
    return `\ufeff${lines.join('\r\n')}`;
  }

  // Get User Transactions (Where user is sender OR receiver)
  async getUserTransactions(userId: string): Promise<FinancialTransaction[]> {
    return this.transactionRepository.find({
      where: [
        { fromUserId: userId },
        { toUserId: userId },
      ],
      order: { transactionDate: 'DESC' },
      relations: ['fromUser', 'toUser']
    });
  }

  // Calculate User Balance (In - Out)
  async getUserBalance(userId: string): Promise<number> {
    const transactions = await this.getUserTransactions(userId);
    let balance = 0.0;

    for (const tx of transactions) {
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
  async getDashboardStats(user: any) {
    const scopedIds = await this.getScopedUserIds(user);

    // Financial Stats
    const totalSales = await this.sumAmountByType(TransactionType.SALE, user);
    const totalRentals = await this.sumAmountByType(TransactionType.RENT, user);
    const totalCommission = await this.sumCommission(user); 
    const totalRevenue = totalCommission; // Assuming revenue is commission
    const totalTax = await this.sumTax(user);
    const totalExpenses = await this.sumAmountByType(TransactionType.EXPENSE, user);
    const netProfit = totalCommission - totalExpenses;

    // User Stats
    const totalUsers = this.isAdmin(user)
      ? await this.userRepository.count()
      : scopedIds.length;
    
    // Operations Stats (Bookings)
    // Active = Pending, Accepted, Paid (Not Completed or Cancelled)
    const bookingWhere = this.isAdmin(user)
      ? [
          { status: BookingStatus.PENDING },
          { status: BookingStatus.ACCEPTED },
          { status: BookingStatus.PAID },
        ]
      : [
          { userId: In(scopedIds), status: BookingStatus.PENDING } as any,
          { userId: In(scopedIds), status: BookingStatus.ACCEPTED } as any,
          { userId: In(scopedIds), status: BookingStatus.PAID } as any,
        ];

    const activeOperations = await this.bookingRepository.count({ where: bookingWhere as any });

    const totalBookings = this.isAdmin(user)
      ? await this.bookingRepository.count()
      : await this.bookingRepository.count({ where: { userId: In(scopedIds) } as any });
    const completedBookings = this.isAdmin(user)
      ? await this.bookingRepository.count({ where: { status: BookingStatus.COMPLETED } })
      : await this.bookingRepository.count({ where: { userId: In(scopedIds), status: BookingStatus.COMPLETED } as any });

    // Conversion Rate: Completed / Total (Prevent division by zero)
    const conversionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

    const invoiceBase = this.invoiceRepository.createQueryBuilder('inv');
    await this.applyInvoiceScope(invoiceBase, 'inv', user);
    const invoiceRows = await invoiceBase.getMany();
    const invoiceStats = {
      paidCount: invoiceRows.filter((inv) => inv.status === InvoiceStatus.PAID).length,
      unpaidCount: invoiceRows.filter((inv) => inv.status === InvoiceStatus.UNPAID).length,
      draftCount: invoiceRows.filter((inv) => inv.status === InvoiceStatus.DRAFT).length,
      paidTotal: invoiceRows.filter((inv) => inv.status === InvoiceStatus.PAID).reduce((sum, inv) => sum + Number(inv.total || 0), 0),
      outstandingTotal: invoiceRows.filter((inv) => inv.status === InvoiceStatus.UNPAID).reduce((sum, inv) => sum + Number(inv.total || 0), 0),
    };

    const recentTransactionsQuery = this.transactionRepository
      .createQueryBuilder('tx')
      .orderBy('tx.transactionDate', 'DESC')
      .take(8);
    await this.applyTransactionScope(recentTransactionsQuery, 'tx', user);
    const recentTransactions = await recentTransactionsQuery.getMany();

    const expenseBreakdownQuery = this.transactionRepository
      .createQueryBuilder('tx')
      .select(`COALESCE(tx.expenseCategory, 'Other')`, 'category')
      .addSelect('COALESCE(SUM(tx.amount), 0)', 'total')
      .where('tx.type = :type', { type: TransactionType.EXPENSE })
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED })
      .groupBy('tx.expenseCategory')
      .orderBy('total', 'DESC')
      .limit(6);
    await this.applyTransactionScope(expenseBreakdownQuery, 'tx', user);
    const expenseBreakdown = await expenseBreakdownQuery.getRawMany().then((rows) =>
      rows.map((row) => ({
        category: row.category || 'Other',
        total: Number(row.total || 0),
      })),
    );

    const monthlyTotals = await this.getMonthlyWorkspaceTotals(user);

    return {
      totalUsers,
      activeOperations,
      totalRevenue,
      conversionRate,
      // Extra details if needed by chart or other views
      totalSales,
      totalRentals,
      totalCommission,
      totalExpenses,
      totalTax,
      netProfit,
      invoiceStats,
      recentTransactions,
      expenseBreakdown,
      monthlyTotals,
    };
  }

  async createInvoice(userId: string, dto: {
    amount: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
  }): Promise<Invoice> {
    const serviceFee = 0;
    const tax = dto.amount * 0.15;
    const total = dto.amount + serviceFee + tax;
    const invoice = this.invoiceRepository.create({
      userId,
      amount: dto.amount,
      serviceFee,
      tax,
      total,
      status: InvoiceStatus.UNPAID,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      description: dto.description,
    });
    return this.invoiceRepository.save(invoice);
  }

  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({ where: { id } });
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');
    invoice.status = status;
    return this.invoiceRepository.save(invoice);
  }

  async payInvoice(userId: string, invoiceId: string, paymentMethod: PaymentMethod): Promise<Invoice> {
    let invoice = await this.invoiceRepository.findOne({ 
        where: [
            { id: invoiceId, userId },
            { referenceId: invoiceId, userId, referenceType: 'ServiceRequest' }
        ]
    });

    // Auto-generate missing invoice for legacy ServiceRequests
    if (!invoice) {
        const serviceRequest = await this.serviceRequestRepository.findOne({ where: { id: invoiceId, userId }});
        if (serviceRequest && serviceRequest.paymentStatus === PaidStatus.UNPAID) {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (user) {
                invoice = this.invoiceRepository.create({
                    user,
                    userId,
                    amount: serviceRequest.price || 0,
                    total: serviceRequest.price || 0,
                    status: InvoiceStatus.UNPAID,
                    description: `فاتورة خدمة: ${serviceRequest.serviceType}`,
                    referenceType: 'ServiceRequest',
                    referenceId: serviceRequest.id,
                });
                invoice = await this.invoiceRepository.save(invoice);
            }
        }
    }

    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === InvoiceStatus.PAID) throw new Error('Invoice already paid');

    if (paymentMethod === PaymentMethod.WALLET) {
      const balance = await this.getUserBalance(userId);
      if (balance < invoice.total) {
        throw new Error('Insufficient balance');
      }

      // Create a transaction to deduct from balance
      const transaction = this.transactionRepository.create({
        type: TransactionType.EXPENSE,
        amount: invoice.total,
        fromUserId: userId,
        status: TransactionStatus.COMPLETED,
        paymentMethod: PaymentMethod.WALLET,
        description: `Payment for Invoice #${invoice.id.substring(0, 8)}: ${invoice.description}`,
        referenceType: 'invoice',
        referenceId: invoice.id,
      });
      await this.transactionRepository.save(transaction);
    }

    invoice.status = InvoiceStatus.PAID;
    
    // IF this invoice is linked to a ServiceRequest, update the ServiceRequest status
    if (invoice.referenceType === 'ServiceRequest' && invoice.referenceId) {
      const serviceRequest = await this.serviceRequestRepository.findOne({ where: { id: invoice.referenceId } });
      if (serviceRequest) {
        serviceRequest.paymentStatus = PaidStatus.PAID;
        // Auto-approve Construction and Legal on payment
        if (['construction', 'legal'].includes(serviceRequest.category)) {
            serviceRequest.adminAccepted = true;
        }
        await this.serviceRequestRepository.save(serviceRequest);
      }
    }

    return this.invoiceRepository.save(invoice);
  }

  async getUserCommissions(userId: string): Promise<Commission[]> {
    return this.commissionRepository.find({
      where: { creatorId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserFiles(userId: string): Promise<any[]> {
    const invoices = await this.invoiceRepository.find({
      where: { userId },
      // Select all necessary fields for the modal
      select: ['id', 'documentUrl', 'createdAt', 'referenceType', 'description', 'amount', 'total', 'status', 'serviceFee', 'tax'], 
    });

    const commissions = await this.commissionRepository.find({
      where: { creatorId: userId },
      select: ['id', 'attachments', 'createdAt', 'commissionNumber', 'type', 'totalAmount', 'commissionAmount', 'propertyType', 'city'],
    });

    const files: any[] = [];

    // Map Invoices with documents
    invoices.forEach(inv => {
        if (inv.documentUrl) {
            files.push({
                id: inv.id,
                type: 'invoice',
                name: `Invoice #${inv.id.substring(0, 8)}`,
                url: inv.documentUrl,
                date: inv.createdAt,
                description: inv.description,
                // Pass full object for modal
                raw: inv
            });
        }
    });

    // Map Commission attachments
    commissions.forEach(comm => {
        if (comm.attachments && comm.attachments.length > 0) {
            comm.attachments.forEach((url, index) => {
                files.push({
                    id: `${comm.id}-${index}`,
                    type: 'commission_doc',
                    name: `Commission #${comm.commissionNumber} - Doc ${index + 1}`,
                    url: url,
                    date: comm.createdAt,
                    description: `Document for Commission ${comm.commissionNumber}`,
                    // Pass full object for commission details if needed
                    raw: comm
                });
            });
        }
    });

    return files.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getCommissions(user: any) {
      // Aggregate commissions by status or time
      // This is a placeholder for more complex aggregation if needed
      const query = this.transactionRepository
        .createQueryBuilder('tx')
        .where('tx.type = :type', { type: TransactionType.COMMISSION })
        .orderBy('tx.transactionDate', 'DESC');
      await this.applyTransactionScope(query, 'tx', user);
      return query.getMany();
  }

  private async sumAmountByType(type: TransactionType, user: any): Promise<number> {
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'sum')
      .where('tx.type = :type', { type })
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED });
    await this.applyTransactionScope(query, 'tx', user);
    const { sum } = await query.getRawOne();
    return Number(sum) || 0;
  }

  private async sumCommission(user: any): Promise<number> {
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.commissionAmount)', 'sum')
      .where('tx.status = :status', { status: TransactionStatus.COMPLETED });
    await this.applyTransactionScope(query, 'tx', user);
    const { sum } = await query.getRawOne();
    return Number(sum) || 0;
  }

  private async sumTax(user: any): Promise<number> {
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.taxAmount)', 'sum')
      .where('tx.status = :status', { status: TransactionStatus.COMPLETED });
    await this.applyTransactionScope(query, 'tx', user);
    const { sum } = await query.getRawOne();
    return Number(sum) || 0;
  }

  private async getMonthlyWorkspaceTotals(user: any) {
    const today = new Date();
    const startD = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.transactionDate >= :startD', { startD })
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED });
    await this.applyTransactionScope(query, 'tx', user);
    const rows = await query.getMany();

    const buckets = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (5 - idx), 1);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleString('en-US', { month: 'short' }),
        income: 0,
        expenses: 0,
        net: 0,
      };
    });

    rows.forEach((tx) => {
      const d = new Date(tx.transactionDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find((item) => item.key === key);
      if (!bucket) return;
      if ([TransactionType.SALE, TransactionType.RENT, TransactionType.COMMISSION, TransactionType.DEPOSIT, TransactionType.SETTLEMENT].includes(tx.type)) {
        bucket.income += Number(tx.amount || 0);
      } else if (tx.type === TransactionType.EXPENSE || tx.type === TransactionType.WITHDRAWAL || tx.type === TransactionType.TAX) {
        bucket.expenses += Number(tx.amount || 0);
      }
      bucket.net = bucket.income - bucket.expenses;
    });

    return buckets.map(({ key, ...rest }) => rest);
  }

  async getChartData(user: any, status?: string, startDate?: string, endDate?: string) {
    const today = new Date();
    let startD: Date;
    let endD: Date = today;

    if (startDate && endDate) {
        startD = new Date(startDate);
        endD = new Date(endDate);
    } else {
        // Fallback to last year if no range provided
        startD = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    }

    const query = this.transactionRepository.createQueryBuilder('tx')
      .where('tx.transactionDate >= :startD', { startD })
      .andWhere('tx.transactionDate <= :endD', { endD });
    await this.applyTransactionScope(query, 'tx', user);

    if (status && status !== 'ALL') {
      query.andWhere('tx.status = :status', { status });
    } else if (!status) {
        // Default to completed only if no status filter is applied explicitly
        query.andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED });
    }

    const transactions = await query.getMany();

    const monthlyData = new Array(12).fill(0);

    transactions.forEach(tx => {
      const date = new Date(tx.transactionDate);
      const month = date.getMonth();
      monthlyData[month] += Number(tx.amount);
    });

    const result: number[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthIndex = d.getMonth();
        result.push(monthlyData[monthIndex]);
    }
    
    return result; 
  }
}
