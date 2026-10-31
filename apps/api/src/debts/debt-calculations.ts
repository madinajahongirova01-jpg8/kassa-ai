import { DebtStatus } from '../generated/prisma/enums';

export interface DebtBalance {
  amountDirams: number;
  paidDirams: number;
}

export type PaymentOutcome =
  | { ok: true; paidDirams: number; remainingDirams: number; status: DebtStatus }
  | { ok: false; reason: 'already-paid' | 'exceeds-remaining'; remainingDirams: number };

function assertValidBalance({ amountDirams, paidDirams }: DebtBalance): void {
  if (!Number.isSafeInteger(amountDirams) || !Number.isSafeInteger(paidDirams)) {
    throw new RangeError('Debt amounts must be integer dirams');
  }
  if (amountDirams <= 0 || paidDirams < 0 || paidDirams > amountDirams) {
    throw new RangeError('Debt balance is inconsistent');
  }
}

export function remainingDirams(balance: DebtBalance): number {
  assertValidBalance(balance);
  return balance.amountDirams - balance.paidDirams;
}

export function debtStatusFor(balance: DebtBalance): DebtStatus {
  const remaining = remainingDirams(balance);
  if (remaining === 0) {
    return DebtStatus.PAID;
  }
  return balance.paidDirams === 0 ? DebtStatus.ACTIVE : DebtStatus.PARTIALLY_PAID;
}

/** Computes the debt state after a payment, refusing payments larger than what is still owed. */
export function applyPayment(balance: DebtBalance, paymentDirams: number): PaymentOutcome {
  if (!Number.isSafeInteger(paymentDirams) || paymentDirams <= 0) {
    throw new RangeError('Payment amount must be a positive integer number of dirams');
  }

  const remaining = remainingDirams(balance);
  if (remaining === 0) {
    return { ok: false, reason: 'already-paid', remainingDirams: 0 };
  }
  if (paymentDirams > remaining) {
    return { ok: false, reason: 'exceeds-remaining', remainingDirams: remaining };
  }

  const next = { amountDirams: balance.amountDirams, paidDirams: balance.paidDirams + paymentDirams };
  return { ok: true, paidDirams: next.paidDirams, remainingDirams: remaining - paymentDirams, status: debtStatusFor(next) };
}

export interface AllocationPart {
  debtId: string;
  amountDirams: number;
  paidDirams: number;
  status: DebtStatus;
}

export type AllocationOutcome =
  | { ok: true; parts: AllocationPart[] }
  | { ok: false; reason: 'nothing-owed' | 'exceeds-remaining'; remainingDirams: number };

/**
 * Splits one customer payment across debts in the given order (oldest first), filling each debt
 * before moving to the next. The whole payment is refused if it exceeds the total still owed.
 */
export function allocatePayment(debts: (DebtBalance & { id: string })[], paymentDirams: number): AllocationOutcome {
  if (!Number.isSafeInteger(paymentDirams) || paymentDirams <= 0) {
    throw new RangeError('Payment amount must be a positive integer number of dirams');
  }

  const totalRemaining = debts.reduce((sum, debt) => sum + remainingDirams(debt), 0);
  if (totalRemaining === 0) {
    return { ok: false, reason: 'nothing-owed', remainingDirams: 0 };
  }
  if (paymentDirams > totalRemaining) {
    return { ok: false, reason: 'exceeds-remaining', remainingDirams: totalRemaining };
  }

  const parts: AllocationPart[] = [];
  let left = paymentDirams;
  for (const debt of debts) {
    const share = Math.min(left, remainingDirams(debt));
    if (share === 0) {
      continue;
    }
    const outcome = applyPayment(debt, share);
    if (!outcome.ok) {
      throw new Error('Allocation produced an invalid payment');
    }
    parts.push({ debtId: debt.id, amountDirams: share, paidDirams: outcome.paidDirams, status: outcome.status });
    left -= share;
    if (left === 0) {
      break;
    }
  }
  return { ok: true, parts };
}

export function revertPayment(balance: DebtBalance, paymentDirams: number): { paidDirams: number; status: DebtStatus } {
  assertValidBalance(balance);
  if (!Number.isSafeInteger(paymentDirams) || paymentDirams <= 0 || paymentDirams > balance.paidDirams) {
    throw new RangeError('Cancelled payment must be a positive amount not above what was paid');
  }
  const next = { amountDirams: balance.amountDirams, paidDirams: balance.paidDirams - paymentDirams };
  return { paidDirams: next.paidDirams, status: debtStatusFor(next) };
}
