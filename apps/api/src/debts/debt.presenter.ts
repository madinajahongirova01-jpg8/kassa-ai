import { formatCalendarDate } from '../common/dates';
import { formatDirams } from '../common/money';
import { Debt, Payment } from '../generated/prisma/client';
import { DebtStatus, PaymentMethod } from '../generated/prisma/enums';
import { remainingDirams } from './debt-calculations';

// Amounts are serialized as somoni strings with two decimals, e.g. "150.50".
export interface PaymentResponse {
  id: string;
  debtId: string;
  amount: string;
  method: PaymentMethod;
  paidOn: string;
  note: string | null;
  groupId: string;
  cancelledAt: Date | null;
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

export interface CancelPaymentResultResponse {
  payments: PaymentResponse[];
  debts: DebtResponse[];
}

/** One payment split across the customer's debts: one payment row per debt it touched. */
export interface CustomerPaymentResultResponse {
  amount: string;
  payments: PaymentResponse[];
  debts: DebtResponse[];
}

/** A payment in the owner-wide list, with the debt and customer it belongs to. */
export interface PaymentListItemResponse extends PaymentResponse {
  debt: { id: string; description: string; occurredOn: string };
  customer: { id: string; name: string };
}

type PaymentWithDebt = Payment & {
  debt: Pick<Debt, 'id' | 'description' | 'occurredOn'> & { customer: { id: string; name: string } };
};

export function toPaymentListItemResponse(payment: PaymentWithDebt): PaymentListItemResponse {
  const { debt } = payment;
  return {
    ...toPaymentResponse(payment),
    debt: { id: debt.id, description: debt.description, occurredOn: formatCalendarDate(debt.occurredOn) },
    customer: { id: debt.customer.id, name: debt.customer.name },
  };
}

export function toPaymentResponse(payment: Payment): PaymentResponse {
  return {
    id: payment.id,
    debtId: payment.debtId,
    amount: formatDirams(payment.amountDirams),
    method: payment.method,
    paidOn: formatCalendarDate(payment.paidOn),
    note: payment.note,
    groupId: payment.groupId,
    cancelledAt: payment.cancelledAt,
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
