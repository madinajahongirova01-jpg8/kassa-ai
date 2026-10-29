import { Injectable, NotFoundException } from '@nestjs/common';
import { formatDirams } from '../common/money';
import { Customer } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

export const CUSTOMER_NOT_FOUND_MESSAGE = 'Customer not found';

export interface CustomerBalanceResponse {
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  openDebtsCount: number;
}

export interface CustomerResponse {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  balance: CustomerBalanceResponse;
  createdAt: Date;
  updatedAt: Date;
}

interface DebtAmounts {
  amountDirams: number;
  paidDirams: number;
}

type CustomerWithDebtAmounts = Customer & { debts: DebtAmounts[] };

const DEBT_AMOUNTS_SELECT = { debts: { select: { amountDirams: true, paidDirams: true } } } as const;

function toCustomerResponse(customer: CustomerWithDebtAmounts): CustomerResponse {
  let total = 0;
  let paid = 0;
  let openDebtsCount = 0;
  for (const debt of customer.debts) {
    total += debt.amountDirams;
    paid += debt.paidDirams;
    if (debt.paidDirams < debt.amountDirams) {
      openDebtsCount += 1;
    }
  }

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    note: customer.note,
    balance: {
      totalAmount: formatDirams(total),
      paidAmount: formatDirams(paid),
      remainingAmount: formatDirams(total - paid),
      openDebtsCount,
    },
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

// Every query is scoped by ownerId: other users' customers behave as if they did not exist.
@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateCustomerDto): Promise<CustomerResponse> {
    const customer = await this.prisma.customer.create({
      data: { ownerId, name: dto.name, phone: dto.phone ?? null, note: dto.note ?? null },
      include: DEBT_AMOUNTS_SELECT,
    });
    return toCustomerResponse(customer);
  }

  async list(ownerId: string): Promise<CustomerResponse[]> {
    const customers = await this.prisma.customer.findMany({
      where: { ownerId },
      include: DEBT_AMOUNTS_SELECT,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    return customers.map(toCustomerResponse);
  }

  async findOne(ownerId: string, id: string): Promise<CustomerResponse> {
    const customer = await this.prisma.customer.findFirst({ where: { id, ownerId }, include: DEBT_AMOUNTS_SELECT });
    if (customer === null) {
      throw new NotFoundException(CUSTOMER_NOT_FOUND_MESSAGE);
    }
    return toCustomerResponse(customer);
  }

  async update(ownerId: string, id: string, dto: UpdateCustomerDto): Promise<CustomerResponse> {
    const { count } = await this.prisma.customer.updateMany({
      where: { id, ownerId },
      data: { name: dto.name, phone: dto.phone, note: dto.note },
    });
    if (count === 0) {
      throw new NotFoundException(CUSTOMER_NOT_FOUND_MESSAGE);
    }
    return this.findOne(ownerId, id);
  }

  async assertOwned(ownerId: string, id: string): Promise<void> {
    const customer = await this.prisma.customer.findFirst({ where: { id, ownerId }, select: { id: true } });
    if (customer === null) {
      throw new NotFoundException(CUSTOMER_NOT_FOUND_MESSAGE);
    }
  }
}
