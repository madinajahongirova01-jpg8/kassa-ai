import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { trimString } from '../../auth/dto/normalize';
import { IsCalendarDate, IsSomoniAmount } from '../../common/validators';

export class UpdateDebtDto {
  @ValidateIf((_dto: UpdateDebtDto, value: unknown) => value !== undefined)
  @IsSomoniAmount()
  amount?: number;

  @ValidateIf((_dto: UpdateDebtDto, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(1, 500)
  description?: string;

  @IsOptional()
  @IsCalendarDate()
  dueOn?: string | null;
}
