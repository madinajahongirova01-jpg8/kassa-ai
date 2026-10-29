import { ArgumentMetadata, BadRequestException, Type } from '@nestjs/common';
import { createValidationPipe } from '../../common/validation.pipe';
import { CreateCustomerDto } from '../../customers/dto/create-customer.dto';
import { UpdateCustomerDto } from '../../customers/dto/update-customer.dto';
import { CreateDebtDto } from './create-debt.dto';
import { CreatePaymentDto } from './create-payment.dto';
import { ListDebtsQueryDto } from './list-debts-query.dto';

const pipe = createValidationPipe();

function validate<T>(metatype: Type<T>, value: unknown, type: ArgumentMetadata['type'] = 'body'): Promise<T> {
  return pipe.transform(value, { type, metatype }) as Promise<T>;
}

async function validationDetails<T>(metatype: Type<T>, value: unknown): Promise<string[]> {
  try {
    await validate(metatype, value);
  } catch (error) {
    if (error instanceof BadRequestException) {
      const body = error.getResponse() as { details?: string[] };
      return body.details ?? [];
    }
    throw error;
  }
  throw new Error('Expected validation to fail');
}

describe('DTO validation', () => {
  describe('CreateCustomerDto', () => {
    it('trims fields and accepts optional phone and note', async () => {
      const dto = await validate(CreateCustomerDto, { name: '  Aziz ', phone: ' +992 90 123-45-67 ', note: ' VIP ' });

      expect(dto).toEqual({ name: 'Aziz', phone: '+992 90 123-45-67', note: 'VIP' });
    });

    it.each([
      ['a missing name', {}],
      ['a blank name', { name: '   ' }],
      ['a too long name', { name: 'x'.repeat(101) }],
      ['an invalid phone', { name: 'Aziz', phone: 'call me' }],
      ['an unknown field', { name: 'Aziz', ownerId: '7f9c2c1e-3b0a-4c39-9a51-0d4f3f7d2a10' }],
    ])('rejects %s', async (_case, payload) => {
      expect((await validationDetails(CreateCustomerDto, payload)).length).toBeGreaterThan(0);
    });
  });

  describe('UpdateCustomerDto', () => {
    it('allows clearing phone and note with null', async () => {
      const dto = await validate(UpdateCustomerDto, { phone: null, note: null });

      expect(dto).toEqual({ phone: null, note: null });
    });

    it('does not allow clearing the name', async () => {
      expect(await validationDetails(UpdateCustomerDto, { name: null })).toContain('name must be a string');
    });
  });

  describe('CreateDebtDto', () => {
    it('converts the amount from somoni to dirams', async () => {
      const dto = await validate(CreateDebtDto, {
        amount: '150.50',
        description: ' Flour 2 bags ',
        occurredOn: '2026-01-15',
        dueOn: '2026-02-15',
      });

      expect(dto).toEqual({ amount: 15_050, description: 'Flour 2 bags', occurredOn: '2026-01-15', dueOn: '2026-02-15' });
    });

    it.each([
      ['zero', '0', 'amount must be greater than 0'],
      ['negative', '-10', 'amount must be an amount in somoni with at most 2 decimal places, for example "150.50"'],
      ['three decimals', '10.005', 'amount must be an amount in somoni with at most 2 decimal places, for example "150.50"'],
      ['too large', '10000000.01', 'amount must not exceed 10000000.00'],
      ['not a number', 'ten', 'amount must be an amount in somoni with at most 2 decimal places, for example "150.50"'],
    ])('rejects a %s amount', async (_case, amount, message) => {
      const details = await validationDetails(CreateDebtDto, { amount, description: 'Flour', occurredOn: '2026-01-15' });

      expect(details).toEqual([message]);
    });

    it('rejects a large integer number instead of treating it as dirams', async () => {
      const details = await validationDetails(CreateDebtDto, {
        amount: 1_000_000_000,
        description: 'Flour',
        occurredOn: '2026-01-15',
      });

      expect(details.length).toBeGreaterThan(0);
    });

    it.each([
      ['a missing amount', { description: 'Flour', occurredOn: '2026-01-15' }],
      ['a missing description', { amount: '10', occurredOn: '2026-01-15' }],
      ['a missing occurredOn', { amount: '10', description: 'Flour' }],
      ['an impossible date', { amount: '10', description: 'Flour', occurredOn: '2026-02-30' }],
      ['a timestamp instead of a date', { amount: '10', description: 'Flour', occurredOn: '2026-01-15T10:00:00Z' }],
      ['an invalid dueOn', { amount: '10', description: 'Flour', occurredOn: '2026-01-15', dueOn: 'tomorrow' }],
    ])('rejects %s', async (_case, payload) => {
      expect((await validationDetails(CreateDebtDto, payload)).length).toBeGreaterThan(0);
    });
  });

  describe('CreatePaymentDto', () => {
    it('accepts a numeric amount with up to two decimals', async () => {
      expect(await validate(CreatePaymentDto, { amount: 25.5 })).toEqual({ amount: 2_550 });
    });

    it('rejects a missing amount', async () => {
      expect((await validationDetails(CreatePaymentDto, { paidOn: '2026-01-15' })).length).toBeGreaterThan(0);
    });
  });

  describe('ListDebtsQueryDto', () => {
    it('rejects an unknown status', async () => {
      await expect(validate(ListDebtsQueryDto, { status: 'LOST' }, 'query')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
