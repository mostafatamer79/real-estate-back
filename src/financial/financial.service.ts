import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    return this.transactionRepository.find({ 
        order: { transactionDate: 'DESC' },
        relations: ['fromUser', 'toUser'] 
    });
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
  async getDashboardStats() {
    // Financial Stats
    const totalSales = await this.sumAmountByType(TransactionType.SALE);
    const totalRentals = await this.sumAmountByType(TransactionType.RENT);
    const totalCommission = await this.sumCommission(); 
    const totalRevenue = totalCommission; // Assuming revenue is commission
    const totalTax = await this.sumTax();
    const totalExpenses = await this.sumAmountByType(TransactionType.EXPENSE);
    const netProfit = totalCommission - totalExpenses;

    // User Stats
    const totalUsers = await this.userRepository.count();
    
    // Operations Stats (Bookings)
    // Active = Pending, Accepted, Paid (Not Completed or Cancelled)
    const activeOperations = await this.bookingRepository.count({
        where: [
            { status: BookingStatus.PENDING },
            { status: BookingStatus.ACCEPTED },
            { status: BookingStatus.PAID },
        ]
    });

    const totalBookings = await this.bookingRepository.count();
    const completedBookings = await this.bookingRepository.count({ where: { status: BookingStatus.COMPLETED } });

    // Conversion Rate: Completed / Total (Prevent division by zero)
    const conversionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

    return {
      totalUsers,
      activeOperations,
      totalRevenue,
      conversionRate,
      // Extra details if needed by chart or other views
      totalSales,
      totalRentals,
      netProfit,
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
      .where('tx.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();
    return Number(sum) || 0;
  }

  private async sumTax(): Promise<number> {
    const { sum } = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.taxAmount)', 'sum')
      .where('tx.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();
    return Number(sum) || 0;
  }

  async getChartData(status?: string, startDate?: string, endDate?: string) {
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
