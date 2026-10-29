import { DebtStatus } from '../generated/prisma/enums';
import { applyPayment, debtStatusFor, remainingDirams } from './debt-calculations';

describe('debt calculations', () => {
  describe('debtStatusFor', () => {
    it.each([
      [10_000, 0, DebtStatus.ACTIVE],
      [10_000, 1, DebtStatus.PARTIALLY_PAID],
      [10_000, 9_999, DebtStatus.PARTIALLY_PAID],
      [10_000, 10_000, DebtStatus.PAID],
    ])('amount %p with %p paid is %p', (amountDirams, paidDirams, expected) => {
      expect(debtStatusFor({ amountDirams, paidDirams })).toBe(expected);
    });

    it.each([
      [0, 0],
      [100, -1],
      [100, 101],
      [100.5, 0],
    ])('rejects an inconsistent balance (%p, %p)', (amountDirams, paidDirams) => {
      expect(() => debtStatusFor({ amountDirams, paidDirams })).toThrow(RangeError);
    });
  });

  it('computes the remaining amount', () => {
    expect(remainingDirams({ amountDirams: 15_050, paidDirams: 5_025 })).toBe(10_025);
  });

  describe('applyPayment', () => {
    it('applies a partial payment', () => {
      expect(applyPayment({ amountDirams: 10_000, paidDirams: 0 }, 2_550)).toEqual({
        ok: true,
        paidDirams: 2_550,
        remainingDirams: 7_450,
        status: DebtStatus.PARTIALLY_PAID,
      });
    });

    it('applies a payment that settles the debt', () => {
      expect(applyPayment({ amountDirams: 10_000, paidDirams: 2_550 }, 7_450)).toEqual({
        ok: true,
        paidDirams: 10_000,
        remainingDirams: 0,
        status: DebtStatus.PAID,
      });
    });

    it('refuses a payment above the remaining amount', () => {
      expect(applyPayment({ amountDirams: 10_000, paidDirams: 2_550 }, 7_451)).toEqual({
        ok: false,
        reason: 'exceeds-remaining',
        remainingDirams: 7_450,
      });
    });

    it('refuses any payment on a paid debt', () => {
      expect(applyPayment({ amountDirams: 10_000, paidDirams: 10_000 }, 1)).toEqual({
        ok: false,
        reason: 'already-paid',
        remainingDirams: 0,
      });
    });

    it.each([0, -100, 1.5, Number.NaN])('throws for an invalid payment amount %p', (amount) => {
      expect(() => applyPayment({ amountDirams: 10_000, paidDirams: 0 }, amount)).toThrow(RangeError);
    });
  });
});
