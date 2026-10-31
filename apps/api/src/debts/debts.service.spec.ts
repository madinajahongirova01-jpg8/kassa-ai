import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { Debt, Payment } from '../generated/prisma/client';
import { DebtStatus, PaymentMethod } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { DebtsService } from './debts.service';

const OWNER_ID = '7f9c2c1e-3b0a-4c39-9a51-0d4f3f7d2a10';
const CUSTOMER_ID = '0b8f7a52-6a43-4f1e-9d1c-3c5f6f9e2b11';
const DEBT_ID = '5d2e8c3a-1f4b-4a6d-8e9f-0a1b2c3d4e5f';

function buildDebt(overrides: Partial<Debt> = {}): Debt {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: DEBT_ID,
    ownerId: OWNER_ID,
    customerId: CUSTOMER_ID,
    amountDirams: 10_000,
    paidDirams: 0,
    status: DebtStatus.ACTIVE,
    description: 'Flour',
    occurredOn: new Date('2026-01-10T00:00:00.000Z'),
    dueOn: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

interface DebtUpdateArgs {
  data: Pick<Debt, 'paidDirams' | 'status'>;
}

interface PaymentCreateArgs {
  data: Pick<Payment, 'ownerId' | 'debtId' | 'amountDirams' | 'method' | 'paidOn' | 'note'>;
}

describe('DebtsService', () => {
  let tx: {
    $queryRaw: jest.Mock;
    debt: { findUniqueOrThrow: jest.Mock; update: jest.Mock<Promise<Debt>, [DebtUpdateArgs]> };
    payment: { create: jest.Mock<Promise<Payment>, [PaymentCreateArgs]> };
  };
  let debts: { create: jest.Mock };
  let assertOwned: jest.Mock<Promise<void>, [string, string]>;
  let service: DebtsService;

  beforeEach(() => {
    tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: DEBT_ID }]),
      debt: {
        findUniqueOrThrow: jest.fn(),
        update: jest.fn((args: DebtUpdateArgs) => Promise.resolve(buildDebt(args.data))),
      },
      payment: {
        create: jest.fn((args: PaymentCreateArgs) =>
          Promise.resolve({ id: 'payment-id', groupId: 'payment-id', cancelledAt: null, createdAt: new Date(), ...args.data }),
        ),
      },
    };
    debts = { create: jest.fn() };
    const prisma = {
      debt: debts,
      $transaction: (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
    } as unknown as PrismaService;
    assertOwned = jest.fn<Promise<void>, [string, string]>().mockResolvedValue(undefined);
    service = new DebtsService(prisma, { assertOwned } as unknown as CustomersService);
  });

  describe('create', () => {
    it('creates a debt for an owned customer', async () => {
      debts.create.mockResolvedValue(buildDebt({ amountDirams: 15_050 }));

      const result = await service.create(OWNER_ID, CUSTOMER_ID, {
        amount: 15_050,
        description: 'Flour',
        occurredOn: '2026-01-10',
      });

      expect(assertOwned).toHaveBeenCalledWith(OWNER_ID, CUSTOMER_ID);
      expect(result).toMatchObject({ amount: '150.50', paidAmount: '0.00', remainingAmount: '150.50', status: 'ACTIVE' });
    });

    it('does not create a debt for a customer of another user', async () => {
      assertOwned.mockRejectedValue(new NotFoundException('Customer not found'));

      await expect(
        service.create(OWNER_ID, CUSTOMER_ID, { amount: 100, description: 'Flour', occurredOn: '2026-01-10' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(debts.create).not.toHaveBeenCalled();
    });

    it('rejects a due date before the debt date', async () => {
      await expect(
        service.create(OWNER_ID, CUSTOMER_ID, {
          amount: 100,
          description: 'Flour',
          occurredOn: '2026-01-10',
          dueOn: '2026-01-09',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(debts.create).not.toHaveBeenCalled();
    });

    it('rejects a debt dated in the future', async () => {
      await expect(
        service.create(OWNER_ID, CUSTOMER_ID, { amount: 100, description: 'Flour', occurredOn: '2999-01-01' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('addPayment', () => {
    it('registers a partial payment and updates the status', async () => {
      tx.debt.findUniqueOrThrow.mockResolvedValue(buildDebt());

      const result = await service.addPayment(OWNER_ID, DEBT_ID, { amount: 2_550, paidOn: '2026-01-11' });

      expect(tx.payment.create.mock.calls[0][0].data).toMatchObject({ ownerId: OWNER_ID, debtId: DEBT_ID, amountDirams: 2_550 });
      expect(tx.debt.update.mock.calls[0][0].data).toEqual({ paidDirams: 2_550, status: DebtStatus.PARTIALLY_PAID });
      expect(result.debt).toMatchObject({ paidAmount: '25.50', remainingAmount: '74.50', status: 'PARTIALLY_PAID' });
      expect(result.payment).toMatchObject({ amount: '25.50', paidOn: '2026-01-11' });
    });

    it('saves cash as the default payment method', async () => {
      tx.debt.findUniqueOrThrow.mockResolvedValue(buildDebt());

      const result = await service.addPayment(OWNER_ID, DEBT_ID, { amount: 1_000, paidOn: '2026-01-11' });

      expect(tx.payment.create.mock.calls[0][0].data.method).toBe(PaymentMethod.CASH);
      expect(result.payment.method).toBe(PaymentMethod.CASH);
    });

    it('saves the chosen payment method', async () => {
      tx.debt.findUniqueOrThrow.mockResolvedValue(buildDebt());

      const result = await service.addPayment(OWNER_ID, DEBT_ID, {
        amount: 1_000,
        paidOn: '2026-01-11',
        method: PaymentMethod.TRANSFER,
      });

      expect(tx.payment.create.mock.calls[0][0].data.method).toBe(PaymentMethod.TRANSFER);
      expect(result.payment.method).toBe(PaymentMethod.TRANSFER);
    });

    it('marks the debt as paid when the remaining amount is paid', async () => {
      tx.debt.findUniqueOrThrow.mockResolvedValue(
        buildDebt({ paidDirams: 2_550, status: DebtStatus.PARTIALLY_PAID }),
      );

      const result = await service.addPayment(OWNER_ID, DEBT_ID, { amount: 7_450, paidOn: '2026-01-11' });

      expect(result.debt).toMatchObject({ paidAmount: '100.00', remainingAmount: '0.00', status: 'PAID' });
    });

    it('rejects a payment above the remaining amount without writing anything', async () => {
      tx.debt.findUniqueOrThrow.mockResolvedValue(buildDebt({ paidDirams: 2_550, status: DebtStatus.PARTIALLY_PAID }));

      await expect(service.addPayment(OWNER_ID, DEBT_ID, { amount: 7_451, paidOn: '2026-01-11' })).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(tx.payment.create).not.toHaveBeenCalled();
      expect(tx.debt.update).not.toHaveBeenCalled();
    });

    it('treats a debt of another user as not found', async () => {
      tx.$queryRaw.mockResolvedValue([]);

      await expect(service.addPayment(OWNER_ID, DEBT_ID, { amount: 100 })).rejects.toBeInstanceOf(NotFoundException);
      expect(tx.debt.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(tx.payment.create).not.toHaveBeenCalled();
    });

    it('rejects a payment dated before the debt', async () => {
      tx.debt.findUniqueOrThrow.mockResolvedValue(buildDebt());

      await expect(service.addPayment(OWNER_ID, DEBT_ID, { amount: 100, paidOn: '2026-01-09' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(tx.payment.create).not.toHaveBeenCalled();
    });

    it('rejects a payment dated in the future', async () => {
      await expect(service.addPayment(OWNER_ID, DEBT_ID, { amount: 100, paidOn: '2999-01-01' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(tx.$queryRaw).not.toHaveBeenCalled();
    });
  });
});
