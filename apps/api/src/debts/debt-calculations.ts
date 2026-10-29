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
