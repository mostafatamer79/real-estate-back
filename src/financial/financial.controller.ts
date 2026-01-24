import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
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
}
