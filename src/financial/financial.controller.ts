import { Controller, Get, Post, Put, Delete, Body, UseGuards, Request, Param, Query, ParseUUIDPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import { FinancialService } from './financial.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { Departments } from '../common/decorators/departments.decorators';
import { DepartmentsGuard } from '../common/guards/departments.guard';
import { SkipSubscriptionGuard } from '../common/decorators/skip-subscription.decorator';

@SkipSubscriptionGuard()
@Controller('financial')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('transaction')
  @Departments('finance')
  create(@Body() createDto: CreateTransactionDto) {
    return this.financialService.createTransaction(createDto);
  }

  @Post('expense')
  @Departments('finance')
  createExpense(@Body() createDto: CreateTransactionDto) {
    return this.financialService.createExpense(createDto);
  }

  @Post('withdraw')
  async requestWithdrawal(@Request() req, @Body() body: { amount: number }) {
    return this.financialService.requestWithdrawal(req.user.userId, body.amount);
  }

  @Get('dashboard')
  @Departments('finance')
  getDashboardStats(@Request() req) {
    return this.financialService.getDashboardStats(req.user);
  }

  @Get('workspace-summary')
  @Departments('finance')
  getWorkspaceSummary(@Request() req) {
    return this.financialService.getDashboardStats(req.user);
  }

  @Get('transactions')
  @Departments('finance')
  findAll(@Request() req) {
    return this.financialService.findAll(req.user);
  }

  @Put('transactions/:id')
  @Departments('finance')
  updateTransaction(@Param('id', ParseUUIDPipe) id: string, @Body() body: Partial<CreateTransactionDto>) {
    return this.financialService.updateTransaction(id, body);
  }

  @Delete('transactions/:id')
  @Departments('finance')
  async deleteTransaction(@Param('id', ParseUUIDPipe) id: string) {
    await this.financialService.deleteTransaction(id);
    return { success: true };
  }

  @Get('transactions/export')
  @Departments('finance')
  async exportTransactions(
    @Request() req,
    @Res() res: Response,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    const csv = await this.financialService.exportTransactionsCsv(req.user, { type, status, startDate, endDate, search });
    const datePart = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="wallet-transactions-${datePart}.csv"`);
    return res.send(csv);
  }

  @Get('commissions')
  @Departments('finance')
  getCommissions(@Request() req) {
    return this.financialService.getCommissions(req.user);
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
  @Departments('finance')
  getChartData(
    @Request() req,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.financialService.getChartData(req.user, status, startDate, endDate);
  }

  @Post('invoices')
  async createInvoice(
    @Request() req,
    @Body() body: { amount: number; referenceType?: string; referenceId?: string; description?: string },
  ) {
    return this.financialService.createInvoice(req.user.userId, body);
  }

  @Post('invoices/user/:userId')
  @Departments('finance')
  async createUserInvoice(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: { amount: number; referenceType?: string; referenceId?: string; description?: string; documentUrl?: string },
  ) {
    return this.financialService.createInvoice(userId, body);
  }

  @Get('invoices/my')
  async getMyInvoices(@Request() req) {
    return this.financialService.getUserInvoices(req.user.userId);
  }

  @Get('invoices')
  @Departments('finance')
  async getAllInvoices(@Request() req) {
    return this.financialService.getAllInvoices(req.user);
  }

  @Get('invoices/user/:userId')
  @Departments('finance')
  async getUserInvoices(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.financialService.getUserInvoices(userId);
  }

  @Put('invoices/:id')
  @Departments('finance')
  async updateInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { amount?: number; description?: string; status?: string; documentUrl?: string | null },
  ) {
    return this.financialService.updateInvoice(id, body);
  }

  @Delete('invoices/:id')
  @Departments('finance')
  async deleteInvoice(@Param('id', ParseUUIDPipe) id: string) {
    await this.financialService.deleteInvoice(id);
    return { success: true };
  }

  @Get('commissions/my')
  async getMyCommissions(@Request() req) {
    return this.financialService.getUserCommissions(req.user.userId);
  }

  @Get('commissions/user/:userId')
  @Departments('finance')
  async getUserCommissions(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.financialService.getUserCommissions(userId);
  }

  @Put('commissions/:id')
  @Departments('finance')
  async updateCommission(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status?: string; finalCommissionAmount?: number; notes?: string; attachmentUrl?: string },
  ) {
    return this.financialService.updateCommissionForAdmin(id, body, req.user);
  }

  @Delete('commissions/:id')
  @Departments('finance')
  async deleteCommission(@Param('id', ParseUUIDPipe) id: string) {
    await this.financialService.deleteCommissionForAdmin(id);
    return { success: true };
  }

  @Get('files/my')
  async getMyFiles(@Request() req) {
    return this.financialService.getUserFiles(req.user.userId);
  }

  @Get('files')
  @Departments('finance')
  async getAllFiles(@Request() req) {
    return this.financialService.getAllFiles(req.user);
  }

  @Get('files/user/:userId')
  @Departments('finance')
  async getUserFiles(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.financialService.getUserFiles(userId);
  }

  @Put('files/invoice/:id')
  @Departments('finance')
  async updateInvoiceDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { documentUrl?: string | null },
  ) {
    return this.financialService.updateInvoice(id, { documentUrl: body.documentUrl || null });
  }

  @Delete('files/commission/:id/attachments')
  @Departments('finance')
  async removeCommissionAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { url: string },
  ) {
    return this.financialService.removeCommissionAttachment(id, body.url);
  }

  @Get('wallet/user/:userId')
  @Departments('finance')
  async getUserWallet(@Param('userId', ParseUUIDPipe) userId: string) {
    const balance = await this.financialService.getUserBalance(userId);
    const transactions = await this.financialService.getUserTransactions(userId);
    return { balance, transactions };
  }

  @Post('scan-report')
  async generateScanReport(
    @Request() req,
    @Body() body: { latitude: number; longitude: number; radius: number; mapImage?: string; locationName?: string },
  ) {
    return this.financialService.generateScanReportFiles(req.user.userId, body);
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
