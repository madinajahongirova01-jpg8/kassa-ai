import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { formatCalendarDate, parseCalendarDate } from '../common/dates';
import { formatDirams } from '../common/money';
import { PrismaService } from '../prisma/prisma.service';
import { debtStatusFor, revertPayment } from './debt-calculations';
import { CancelPaymentResultResponse, DebtResponse, toDebtResponse, toPaymentResponse } from './debt.presenter';
import { DEBT_NOT_FOUND_MESSAGE, invalidInput } from './debts.service';
import { UpdateDebtDto } from './dto/update-debt.dto';

export const PAYMENT_NOT_FOUND_MESSAGE = 'Payment not found';

@Injectable()
export class DebtEditsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateDebt(ownerId: string, id: string, dto: UpdateDebtDto): Promise<DebtResponse> {
    if (dto.amount === undefined && dto.description === undefined && dto.dueOn === undefined) {
      throw invalidInput('at least one of amount, description, dueOn is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "debts" WHERE "id" = ${id}::uuid AND "owner_id" = ${ownerId}::uuid FOR UPDATE`;
      if (locked.length === 0) {
        throw new NotFoundException(DEBT_NOT_FOUND_MESSAGE);
      }

      const debt = await tx.debt.findUniqueOrThrow({ where: { id } });
      const amountDirams = dto.amount ?? debt.amountDirams;
      if (amountDirams < debt.paidDirams) {
        throw new UnprocessableEntityException({
          message: 'Debt amount is less than the amount already paid',
          details: [`paidAmount: ${formatDirams(debt.paidDirams)}`],
        });
      }
      if (typeof dto.dueOn === 'string' && dto.dueOn < formatCalendarDate(debt.occurredOn)) {
        throw invalidInput('dueOn must not be earlier than occurredOn');
      }

      const updated = await tx.debt.update({
        where: { id },
        data: {
          amountDirams,
          status: debtStatusFor({ amountDirams, paidDirams: debt.paidDirams }),
          description: dto.description,
          dueOn: dto.dueOn === undefined ? undefined : dto.dueOn === null ? null : parseCalendarDate(dto.dueOn),
        },
      });
      return toDebtResponse(updated);
    });
  }

  async cancelPayment(ownerId: string, paymentId: string): Promise<CancelPaymentResultResponse> {
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.payment.findFirst({ where: { id: paymentId, ownerId }, select: { groupId: true } });
      if (target === null) {
        throw new NotFoundException(PAYMENT_NOT_FOUND_MESSAGE);
      }
      const { groupId } = target;

      await tx.$queryRaw`
        SELECT "id" FROM "debts"
        WHERE "owner_id" = ${ownerId}::uuid
          AND "id" IN (SELECT "debt_id" FROM "payments" WHERE "group_id" = ${groupId}::uuid AND "owner_id" = ${ownerId}::uuid)
        ORDER BY "occurred_on", "created_at", "id"
        FOR UPDATE`;

      const active = await tx.payment.findMany({ where: { groupId, ownerId, cancelledAt: null } });
      if (active.length > 0) {
        await tx.payment.updateMany({
          where: { id: { in: active.map((payment) => payment.id) } },
          data: { cancelledAt: new Date() },
        });
        const returned = new Map<string, number>();
        for (const payment of active) {
          returned.set(payment.debtId, (returned.get(payment.debtId) ?? 0) + payment.amountDirams);
        }
        for (const [debtId, dirams] of returned) {
          const debt = await tx.debt.findUniqueOrThrow({ where: { id: debtId } });
          await tx.debt.update({ where: { id: debtId }, data: revertPayment(debt, dirams) });
        }
      }

      const payments = await tx.payment.findMany({ where: { groupId, ownerId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
      const debts = await tx.debt.findMany({
        where: { ownerId, id: { in: [...new Set(payments.map((payment) => payment.debtId))] } },
        orderBy: [{ occurredOn: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      });
      return { payments: payments.map(toPaymentResponse), debts: debts.map(toDebtResponse) };
    });
  }
}
