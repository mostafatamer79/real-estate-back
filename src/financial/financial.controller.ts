import { Controller, Get, Post, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('financial')
@UseGuards(JwtAuthGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('transaction')
  create(@Body() createDto: CreateTransactionDto) {
    return this.financialService.createTransaction(createDto);
  }

  @Post('expense')
  createExpense(@Body() createDto: CreateTransactionDto) {
    return this.financialService.createExpense(createDto);
  }

  @Post('withdraw')
  async requestWithdrawal(@Request() req, @Body() body: { amount: number }) {
    return this.financialService.requestWithdrawal(req.user.userId, body.amount);
  }

  @Get('dashboard')
  getDashboardStats() {
    return this.financialService.getDashboardStats();
  }

  @Get('transactions')
  findAll() {
    return this.financialService.findAll();
  }

  @Get('commissions')
  getCommissions() {
    return this.financialService.getCommissions();
  }

  @Get('my-wallet')
  async getMyWallet(@Request() req) {
    const userId = req.user.userId;
    const balance = await this.financialService.getUserBalance(userId);
    const transactions = await this.financialService.getUserTransactions(userId);
    
    return {
      balance,
      transactions,
    };
  }

  @Get('chart-data')
  getChartData(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.financialService.getChartData(status, startDate, endDate);
  }

  @Post('invoices')
  async createInvoice(
    @Request() req,
    @Body() body: { amount: number; referenceType?: string; referenceId?: string; description?: string },
  ) {
    return this.financialService.createInvoice(req.user.userId, body);
  }

  @Get('invoices/my')
  async getMyInvoices(@Request() req) {
    return this.financialService.getUserInvoices(req.user.userId);
  }

  @Get('invoices/user/:userId')
  async getUserInvoices(@Param('userId') userId: string) {
    return this.financialService.getUserInvoices(userId);
  }

  @Get('commissions/my')
  async getMyCommissions(@Request() req) {
    return this.financialService.getUserCommissions(req.user.userId);
  }

  @Get('files/my')
  async getMyFiles(@Request() req) {
    return this.financialService.getUserFiles(req.user.userId);
  }

  @Post('invoices/:id/pay')
  async payInvoice(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { paymentMethod: string },
  ) {
    // Basic mapping of string to enum for now
    const method = body.paymentMethod === 'balance' ? 'wallet' : body.paymentMethod;
    return this.financialService.payInvoice(req.user.userId, id, method as any);
  }
}
