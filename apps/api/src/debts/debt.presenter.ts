import { formatCalendarDate } from '../common/dates';
import { formatDirams } from '../common/money';
import { Debt, Payment } from '../generated/prisma/client';
import { DebtStatus } from '../generated/prisma/enums';
import { remainingDirams } from './debt-calculations';

// Amounts are serialized as somoni strings with two decimals, e.g. "150.50".
export interface PaymentResponse {
  id: string;
  debtId: string;
  amount: string;
  paidOn: string;
  note: string | null;
  createdAt: Date;
}

export interface DebtResponse {
  id: string;
  customerId: string;
  amount: string;
  paidAmount: string;
  remainingAmount: string;
  status: DebtStatus;
  description: string;
  occurredOn: string;
  dueOn: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtWithPaymentsResponse extends DebtResponse {
  payments: PaymentResponse[];
}

export interface PaymentResultResponse {
  payment: PaymentResponse;
  debt: DebtResponse;
}

export function toPaymentResponse(payment: Payment): PaymentResponse {
  return {
    id: payment.id,
    debtId: payment.debtId,
    amount: formatDirams(payment.amountDirams),
    paidOn: formatCalendarDate(payment.paidOn),
    note: payment.note,
    createdAt: payment.createdAt,
  };
}

export function toDebtResponse(debt: Debt): DebtResponse {
  return {
    id: debt.id,
    customerId: debt.customerId,
    amount: formatDirams(debt.amountDirams),
    paidAmount: formatDirams(debt.paidDirams),
    remainingAmount: formatDirams(remainingDirams(debt)),
    status: debt.status,
    description: debt.description,
    occurredOn: formatCalendarDate(debt.occurredOn),
    dueOn: debt.dueOn === null ? null : formatCalendarDate(debt.dueOn),
    createdAt: debt.createdAt,
    updatedAt: debt.updatedAt,
  };
}
