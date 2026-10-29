import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import type { PublicUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DateRangePageQueryDto } from '../common/date-range.dto';
import { Page } from '../common/pagination';
import {
  CustomerPaymentResultResponse,
  DebtResponse,
  DebtWithPaymentsResponse,
  PaymentListItemResponse,
  PaymentResponse,
  PaymentResultResponse,
} from './debt.presenter';
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListDebtsQueryDto } from './dto/list-debts-query.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class DebtsController {
  constructor(private readonly debts: DebtsService) {}

  @Post('customers/:customerId/debts')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: PublicUser,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: CreateDebtDto,
  ): Promise<DebtResponse> {
    return this.debts.create(user.id, customerId, dto);
  }

  @Post('customers/:customerId/payments')
  @HttpCode(HttpStatus.CREATED)
  addCustomerPayment(
    @CurrentUser() user: PublicUser,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: CreatePaymentDto,
  ): Promise<CustomerPaymentResultResponse> {
    return this.debts.addCustomerPayment(user.id, customerId, dto);
  }

  @Get('payments')
  listAllPayments(
    @CurrentUser() user: PublicUser,
    @Query() query: DateRangePageQueryDto,
  ): Promise<Page<PaymentListItemResponse>> {
    return this.debts.listAllPayments(user.id, query);
  }

  @Get('customers/:customerId/debts')
  listForCustomer(
    @CurrentUser() user: PublicUser,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ): Promise<DebtResponse[]> {
    return this.debts.listForCustomer(user.id, customerId);
  }

  @Get('debts')
  list(@CurrentUser() user: PublicUser, @Query() query: ListDebtsQueryDto): Promise<DebtResponse[]> {
    return this.debts.list(user.id, query);
  }

  @Get('debts/:id')
  findOne(@CurrentUser() user: PublicUser, @Param('id', ParseUUIDPipe) id: string): Promise<DebtWithPaymentsResponse> {
    return this.debts.findOne(user.id, id);
  }

  @Post('debts/:id/payments')
  @HttpCode(HttpStatus.CREATED)
  addPayment(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePaymentDto,
  ): Promise<PaymentResultResponse> {
    return this.debts.addPayment(user.id, id, dto);
  }

  @Get('debts/:id/payments')
  listPayments(@CurrentUser() user: PublicUser, @Param('id', ParseUUIDPipe) id: string): Promise<PaymentResponse[]> {
    return this.debts.listPayments(user.id, id);
  }
}
