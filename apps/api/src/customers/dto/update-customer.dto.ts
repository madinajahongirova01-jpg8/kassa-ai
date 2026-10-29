import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator';
import { trimString } from '../../auth/dto/normalize';
import { PHONE_MESSAGE, PHONE_PATTERN } from './create-customer.dto';

// Omitted fields stay unchanged; `phone` and `note` can be cleared with null, `name` cannot.
export class UpdateCustomerDto {
  @ValidateIf((_dto: UpdateCustomerDto, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(1, 500)
  note?: string | null;
}
