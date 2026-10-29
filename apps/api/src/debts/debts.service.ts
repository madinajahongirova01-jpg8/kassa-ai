import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { formatCalendarDate, parseCalendarDate, todayInBusinessTimeZone } from '../common/dates';
import { formatDirams } from '../common/money';
import { CustomersService } from '../customers/customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { applyPayment } from './debt-calculations';
import {
  DebtResponse,
  DebtWithPaymentsResponse,
  PaymentResponse,
  PaymentResultResponse,
  toDebtResponse,
  toPaymentResponse,
} from './debt.presenter';
import { CreateDebtDto } from './dto/create-debt.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListDebtsQueryDto } from './dto/list-debts-query.dto';

export const DEBT_NOT_FOUND_MESSAGE = 'Debt not found';

function invalidInput(...details: string[]): BadRequestException {
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
      include: { payments: { orderBy: [{ paidOn: 'asc' }, { createdAt: 'asc' }] } },
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
        data: { ownerId, debtId, amountDirams: dto.amount, paidOn: parseCalendarDate(paidOn), note: dto.note ?? null },
      });
      const updated = await tx.debt.update({
        where: { id: debtId },
        data: { paidDirams: outcome.paidDirams, status: outcome.status },
      });
      return { payment: toPaymentResponse(payment), debt: toDebtResponse(updated) };
    });
  }
}
