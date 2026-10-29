import { BadRequestException } from '@nestjs/common';
import { createValidationPipe } from '../../common/validation.pipe';
import { RegisterDto } from './register.dto';

const pipe = createValidationPipe();
const PASSWORD = 'correct-horse-battery';

function validate(value: unknown): Promise<RegisterDto> {
  return pipe.transform(value, { type: 'body', metatype: RegisterDto }) as Promise<RegisterDto>;
}

async function validationDetails(value: unknown): Promise<string[]> {
  try {
    await validate(value);
  } catch (error) {
    if (error instanceof BadRequestException) {
      const body = error.getResponse() as { details?: string[] };
      return body.details ?? [];
    }
    throw error;
  }
  throw new Error('Expected validation to fail');
}

describe('RegisterDto', () => {
  it('trims businessName and keeps name optional', async () => {
    const dto = await validate({ email: 'owner@example.com', password: PASSWORD, businessName: '  Chaikhona Rukh ' });

    expect(dto.businessName).toBe('Chaikhona Rukh');
    expect(dto.name).toBeUndefined();
  });

  it('requires businessName', async () => {
    const details = await validationDetails({ email: 'owner@example.com', password: PASSWORD });

    expect(details.some((detail) => detail.startsWith('businessName'))).toBe(true);
  });

  it.each([
    ['blank', '   '],
    ['too long', 'x'.repeat(101)],
    ['not a string', 42],
  ])('rejects a %s businessName', async (_label, businessName) => {
    const details = await validationDetails({ email: 'owner@example.com', password: PASSWORD, businessName });

    expect(details.some((detail) => detail.startsWith('businessName'))).toBe(true);
  });
});
