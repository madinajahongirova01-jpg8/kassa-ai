import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { formatCalendarDate, parseCalendarDate, todayInBusinessTimeZone } from '../common/dates';
import { calendarDateFilter } from '../common/date-range.dto';
import { formatDirams } from '../common/money';
import { decodeCursor, DEFAULT_PAGE_SIZE, Page, toPage } from '../common/pagination';
import { CUSTOMER_NOT_FOUND_MESSAGE, CustomersService } from '../customers/customers.service';
import { DebtStatus, PaymentMethod } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { allocatePayment, applyPayment } from './debt-calculations';
import {
  CustomerPaymentResultResponse,
  DebtResponse,
  DebtWithPaymentsResponse,
  PaymentListItemResponse,
  PaymentResponse,
  PaymentResultResponse,
  toDebtResponse,
  toPaymentListItemResponse,
  toPaymentResponse,
} from './debt.presenter';
import { CreateDebtDto } from './dto/create-debt.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListDebtsQueryDto } from './dto/list-debts-query.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';

export const DEBT_NOT_FOUND_MESSAGE = 'Debt not found';

export function invalidInput(...details: string[]): BadRequestException {
  return new BadRequestException({ message: 'Validation failed', details });
}

// Every query is scoped by ownerId: other users' debts and payments behave as if they did not exist.
@Injectable()
export class DebtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customers: CustomersService,
  ) {}

  async create(ownerId: string, customerId: string, dto: CreateDebtDto): Promise<DebtResponse> {
    const today = todayInBusinessTimeZone();
    const errors: string[] = [];
    if (dto.occurredOn > today) {
      errors.push('occurredOn must not be in the future');
    }
    if (dto.dueOn !== undefined && dto.dueOn < dto.occurredOn) {
      errors.push('dueOn must not be earlier than occurredOn');
    }
    if (errors.length > 0) {
      throw invalidInput(...errors);
    }

    await this.customers.assertOwned(ownerId, customerId);
    const debt = await this.prisma.debt.create({
      data: {
        ownerId,
        customerId,
        amountDirams: dto.amount,
        description: dto.description,
        occurredOn: parseCalendarDate(dto.occurredOn),
        dueOn: dto.dueOn === undefined ? null : parseCalendarDate(dto.dueOn),
      },
    });
    return toDebtResponse(debt);
  }

  async listForCustomer(ownerId: string, customerId: string): Promise<DebtResponse[]> {
    await this.customers.assertOwned(ownerId, customerId);
    return this.list(ownerId, { customerId });
  }

  async list(ownerId: string, query: ListDebtsQueryDto): Promise<DebtResponse[]> {
    const debts = await this.prisma.debt.findMany({
      where: { ownerId, status: query.status, customerId: query.customerId },
      orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
    });
    return debts.map(toDebtResponse);
  }

  async findOne(ownerId: string, id: string): Promise<DebtWithPaymentsResponse> {
    const debt = await this.prisma.debt.findFirst({
      where: { id, ownerId },
      include: { payments: { where: { cancelledAt: null }, orderBy: [{ paidOn: 'asc' }, { createdAt: 'asc' }] } },
    });
    if (debt === null) {
      throw new NotFoundException(DEBT_NOT_FOUND_MESSAGE);
    }
    return { ...toDebtResponse(debt), payments: debt.payments.map(toPaymentResponse) };
  }

  async listPayments(ownerId: string, debtId: string): Promise<PaymentResponse[]> {
    return (await this.findOne(ownerId, debtId)).payments;
  }

  /**
   * Registers a payment inside a transaction that locks the debt row, so concurrent payments
   * cannot together exceed the remaining amount. Database CHECK constraints guard the same invariant.
   */
  async addPayment(ownerId: string, debtId: string, dto: CreatePaymentDto): Promise<PaymentResultResponse> {
    const paidOn = dto.paidOn ?? todayInBusinessTimeZone();
    if (paidOn > todayInBusinessTimeZone()) {
      throw invalidInput('paidOn must not be in the future');
    }

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "debts" WHERE "id" = ${debtId}::uuid AND "owner_id" = ${ownerId}::uuid FOR UPDATE`;
      if (locked.length === 0) {
        throw new NotFoundException(DEBT_NOT_FOUND_MESSAGE);
      }

      const debt = await tx.debt.findUniqueOrThrow({ where: { id: debtId } });
      if (paidOn < formatCalendarDate(debt.occurredOn)) {
        throw invalidInput('paidOn must not be earlier than the debt occurredOn date');
      }

      const outcome = applyPayment(debt, dto.amount);
      if (!outcome.ok) {
        throw new UnprocessableEntityException({
          message:
            outcome.reason === 'already-paid' ? 'Debt is already fully paid' : 'Payment exceeds the remaining debt',
          details: [`remainingAmount: ${formatDirams(outcome.remainingDirams)}`],
        });
      }

      const payment = await tx.payment.create({
        data: {
          ownerId,
          debtId,
          amountDirams: dto.amount,
          method: dto.method ?? PaymentMethod.CASH,
          paidOn: parseCalendarDate(paidOn),
          note: dto.note ?? null,
        },
      });
      const updated = await tx.debt.update({
        where: { id: debtId },
        data: { paidDirams: outcome.paidDirams, status: outcome.status },
      });
      return { payment: toPaymentResponse(payment), debt: toDebtResponse(updated) };
    });
  }

  /** All payments of the owner, newest first, optionally limited to an inclusive paidOn range. */
  async listAllPayments(ownerId: string, query: ListPaymentsQueryDto): Promise<Page<PaymentListItemResponse>> {
    const paidOn = calendarDateFilter(query.from, query.to);
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const cursor = query.cursor === undefined ? undefined : decodeCursor(query.cursor);
    const cursorDate = cursor === undefined ? undefined : parseCalendarDate(cursor.date);

    const payments = await this.prisma.payment.findMany({
      where: {
        ownerId,
        paidOn,
        cancelledAt: query.includeCancelled === true ? undefined : null,
        OR:
          cursor === undefined || cursorDate === undefined
            ? undefined
            : [
                { paidOn: { lt: cursorDate } },
                { paidOn: cursorDate, createdAt: { lt: cursor.createdAt } },
                { paidOn: cursorDate, createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
      },
      include: {
        debt: { select: { id: true, description: true, occurredOn: true, customer: { select: { id: true, name: true } } } },
      },
      orderBy: [{ paidOn: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    return toPage(
      payments,
      limit,
      (payment) => ({ date: formatCalendarDate(payment.paidOn), createdAt: payment.createdAt, id: payment.id }),
      toPaymentListItemResponse,
    );
  }

  /**
   * Registers one customer payment split across their open debts, oldest first, in a single
   * transaction. All open debts are locked in a fixed order, so concurrent payments cannot overpay,
   * and either every part is saved or none is.
   */
  async addCustomerPayment(
    ownerId: string,
    customerId: string,
    dto: CreatePaymentDto,
  ): Promise<CustomerPaymentResultResponse> {
    const paidOn = dto.paidOn ?? todayInBusinessTimeZone();
    if (paidOn > todayInBusinessTimeZone()) {
      throw invalidInput('paidOn must not be in the future');
    }

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({ where: { id: customerId, ownerId }, select: { id: true } });
      if (customer === null) {
        throw new NotFoundException(CUSTOMER_NOT_FOUND_MESSAGE);
      }

      await tx.$queryRaw`
        SELECT "id" FROM "debts"
        WHERE "customer_id" = ${customerId}::uuid AND "owner_id" = ${ownerId}::uuid AND "paid_dirams" < "amount_dirams"
        ORDER BY "occurred_on", "created_at", "id"
        FOR UPDATE`;
      const open = await tx.debt.findMany({
        where: { customerId, ownerId, status: { not: DebtStatus.PAID } },
        orderBy: [{ occurredOn: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      });
      if (open.length === 0) {
        throw new UnprocessableEntityException({
          message: 'Customer has no open debts',
          details: ['remainingAmount: 0.00'],
        });
      }

      // A payment can only cover debts that already existed on its date.
      const eligible = open.filter((debt) => formatCalendarDate(debt.occurredOn) <= paidOn);
      if (eligible.length === 0) {
        throw invalidInput('paidOn must not be earlier than the debt occurredOn date');
      }

      const outcome = allocatePayment(eligible, dto.amount);
      if (!outcome.ok) {
        throw new UnprocessableEntityException({
          message: 'Payment exceeds the remaining debt',
          details: [`remainingAmount: ${formatDirams(outcome.remainingDirams)}`],
        });
      }

      const groupId = randomUUID();
      const payments: PaymentResponse[] = [];
      const debts: DebtResponse[] = [];
      for (const part of outcome.parts) {
        const payment = await tx.payment.create({
          data: {
            ownerId,
            debtId: part.debtId,
            groupId,
            amountDirams: part.amountDirams,
            method: dto.method ?? PaymentMethod.CASH,
            paidOn: parseCalendarDate(paidOn),
            note: dto.note ?? null,
          },
        });
        const updated = await tx.debt.update({
          where: { id: part.debtId },
          data: { paidDirams: part.paidDirams, status: part.status },
        });
        payments.push(toPaymentResponse(payment));
        debts.push(toDebtResponse(updated));
      }
      return { amount: formatDirams(dto.amount), payments, debts };
    });
  }
}
