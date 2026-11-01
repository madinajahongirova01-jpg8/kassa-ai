import { Injectable } from '@nestjs/common';
import { parseCalendarDate, todayInBusinessTimeZone } from '../common/dates';
import { DebtsService } from '../debts/debts.service';
import { Customer, Prisma, TelegramTransaction } from '../generated/prisma/client';
import {
  CashCategory,
  CashEntryKind,
  DebtStatus,
  EntrySource,
  PaymentMethod,
  TelegramTransactionType,
} from '../generated/prisma/enums';

// Same limits as the Kassa DTOs for cash entry titles, customer names and debt or payment notes.
const TITLE_MAX_LENGTH = 200;
const CUSTOMER_NAME_MAX_LENGTH = 100;

export type TelegramSyncFailure = 'customer-not-found' | 'customer-ambiguous';

/** A confirmed receipt that cannot be written to Kassa; the whole confirmation is rolled back. */
export class TelegramSyncError extends Error {
  constructor(readonly reason: TelegramSyncFailure) {
    super(`Telegram receipt cannot be written to Kassa: ${reason}`);
    this.name = 'TelegramSyncError';
  }
}

export interface KassaReferences {
  cashEntryId?: string;
  debtId?: string;
  paymentGroupId?: string;
}

/**
 * Writes one confirmed Telegram receipt to the Kassa data of ownerId, inside the caller's
 * transaction. Every read and write is scoped by ownerId; debts reference customers through the
 * composite (customer_id, owner_id) foreign key, so a debt can never point at another owner's
 * customer. A nasia (credit sale) only ever becomes a debt, never a cash entry.
 */
@Injectable()
export class TelegramKassaSync {
  constructor(private readonly debts: DebtsService) {}

  async write(tx: Prisma.TransactionClient, ownerId: string, receipt: TelegramTransaction): Promise<KassaReferences> {
    const occurredOn = todayInBusinessTimeZone(receipt.occurredAt);
    const title = receipt.description.trim().slice(0, TITLE_MAX_LENGTH);

    switch (receipt.type) {
      case TelegramTransactionType.SALE:
      case TelegramTransactionType.EXPENSE: {
        const isSale = receipt.type === TelegramTransactionType.SALE;
        const entry = await tx.cashEntry.create({
          data: {
            ownerId,
            kind: isSale ? CashEntryKind.INCOME : CashEntryKind.EXPENSE,
            category: isSale ? CashCategory.SALE : CashCategory.OTHER,
            amountDirams: receipt.amountDirams,
            title,
            occurredOn: parseCalendarDate(occurredOn),
            source: EntrySource.TEXT,
          },
          select: { id: true },
        });
        return { cashEntryId: entry.id };
      }

      case TelegramTransactionType.CREDIT_SALE: {
        const customer = await this.customerForNasia(tx, ownerId, this.customerName(receipt));
        const debt = await tx.debt.create({
          data: {
            ownerId,
            customerId: customer.id,
            amountDirams: receipt.amountDirams,
            description: title,
            occurredOn: parseCalendarDate(occurredOn),
          },
          select: { id: true },
        });
        return { debtId: debt.id };
      }

      case TelegramTransactionType.DEBT_PAYMENT: {
        const customer = await this.customerForPayment(tx, ownerId, this.customerName(receipt));
        const result = await this.debts.addCustomerPaymentInTransaction(tx, ownerId, customer.id, {
          amount: receipt.amountDirams,
          method: PaymentMethod.CASH,
          paidOn: occurredOn,
          note: title,
        });
        return { paymentGroupId: result.payments[0].groupId };
      }
    }
  }

  private customerName(receipt: TelegramTransaction): string {
    const name = receipt.customerName?.trim().slice(0, CUSTOMER_NAME_MAX_LENGTH) ?? '';
    if (name === '') {
      throw new TelegramSyncError('customer-not-found');
    }
    return name;
  }

  private sameName(tx: Prisma.TransactionClient, ownerId: string, name: string): Promise<Pick<Customer, 'id'>[]> {
    return tx.customer.findMany({
      where: { ownerId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  /** The owner's only customer with that name (any case), or a new one; never guesses between two. */
  private async customerForNasia(tx: Prisma.TransactionClient, ownerId: string, name: string): Promise<Pick<Customer, 'id'>> {
    const matches = await this.sameName(tx, ownerId, name);
    if (matches.length > 1) {
      throw new TelegramSyncError('customer-ambiguous');
    }
    return matches[0] ?? (await tx.customer.create({ data: { ownerId, name }, select: { id: true } }));
  }

  /** The owner's customer with that name who owes money; when several share the name, only one may owe. */
  private async customerForPayment(tx: Prisma.TransactionClient, ownerId: string, name: string): Promise<Pick<Customer, 'id'>> {
    const matches = await this.sameName(tx, ownerId, name);
    if (matches.length === 0) {
      throw new TelegramSyncError('customer-not-found');
    }
    if (matches.length === 1) {
      return matches[0];
    }
    const owing = await tx.customer.findMany({
      where: { ownerId, id: { in: matches.map((match) => match.id) }, debts: { some: { status: { not: DebtStatus.PAID } } } },
      select: { id: true },
    });
    if (owing.length !== 1) {
      throw new TelegramSyncError('customer-ambiguous');
    }
    return owing[0];
  }
}
