import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';
import { trimString } from '../../auth/dto/normalize';
import { IsCalendarDate, IsSomoniAmount } from '../../common/validators';

export class CreateDebtDto {
  /** Sent as somoni ("150.50"); holds integer dirams after validation. */
  @IsSomoniAmount()
  amount!: number;

  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(1, 500)
  description!: string;

  @IsCalendarDate()
  occurredOn!: string;

  @IsOptional()
  @IsCalendarDate()
  dueOn?: string;
}
