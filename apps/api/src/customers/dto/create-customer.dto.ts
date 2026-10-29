import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { trimString } from '../../auth/dto/normalize';

export const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{4,19}$/;
export const PHONE_MESSAGE = 
  'phone must be 5-20 characters long and contain only digits, a leading +, spaces, parentheses and dashes';

export class CreateCustomerDto {
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(1, 500)
  note?: string;
}
