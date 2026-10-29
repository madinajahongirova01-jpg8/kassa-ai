import { NotFoundException } from '@nestjs/common';
import { Customer } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from './customers.service';

const OWNER_ID = '7f9c2c1e-3b0a-4c39-9a51-0d4f3f7d2a10';
const CUSTOMER_ID = '0b8f7a52-6a43-4f1e-9d1c-3c5f6f9e2b11';

type CustomerWithDebts = Customer & { debts: { amountDirams: number; paidDirams: number }[] };

function buildCustomer(overrides: Partial<CustomerWithDebts> = {}): CustomerWithDebts {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: CUSTOMER_ID,
    ownerId: OWNER_ID,
    name: 'Aziz',
    phone: null,
    note: null,
    createdAt: now,
    updatedAt: now,
    debts: [],
    ...overrides,
  };
}

describe('CustomersService', () => {
  let customers: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    updateMany: jest.Mock;
  };
  let service: CustomersService;

  beforeEach(() => {
    customers = { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), updateMany: jest.fn() };
    service = new CustomersService({ customer: customers } as unknown as PrismaService);
  });

  it('creates a customer owned by the current user', async () => {
    customers.create.mockResolvedValue(buildCustomer({ phone: '+992901234567' }));

    const result = await service.create(OWNER_ID, { name: 'Aziz', phone: '+992901234567' });

    expect(customers.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { ownerId: OWNER_ID, name: 'Aziz', phone: '+992901234567', note: null } }),
    );
    expect(result.balance).toEqual({ totalAmount: '0.00', paidAmount: '0.00', remainingAmount: '0.00', openDebtsCount: 0 });
  });

  it('summarizes debts in the balance', async () => {
    customers.findFirst.mockResolvedValue(
      buildCustomer({
        debts: [
          { amountDirams: 10_000, paidDirams: 2_550 },
          { amountDirams: 5_000, paidDirams: 5_000 },
        ],
      }),
    );

    const result = await service.findOne(OWNER_ID, CUSTOMER_ID);

    expect(result.balance).toEqual({
      totalAmount: '150.00',
      paidAmount: '75.50',
      remainingAmount: '74.50',
      openDebtsCount: 1,
    });
  });

  it('scopes lookups by owner and hides other users customers', async () => {
    customers.findFirst.mockResolvedValue(null);

    await expect(service.findOne(OWNER_ID, CUSTOMER_ID)).rejects.toBeInstanceOf(NotFoundException);
    expect(customers.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: CUSTOMER_ID, ownerId: OWNER_ID } }),
    );
  });

  it('scopes updates by owner and reports a foreign customer as not found', async () => {
    customers.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.update(OWNER_ID, CUSTOMER_ID, { name: 'Other' })).rejects.toBeInstanceOf(NotFoundException);
    expect(customers.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: CUSTOMER_ID, ownerId: OWNER_ID } }),
    );
  });

  it('lists only the current user customers', async () => {
    customers.findMany.mockResolvedValue([buildCustomer()]);

    await service.list(OWNER_ID);

    expect(customers.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: OWNER_ID } }));
  });
});
