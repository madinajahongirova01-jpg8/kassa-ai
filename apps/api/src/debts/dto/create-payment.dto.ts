import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';
import { trimString } from '../../auth/dto/normalize';
import { IsCalendarDate, IsSomoniAmount } from '../../common/validators';

export class CreatePaymentDto {
  /** Sent as somoni ("150.50"); holds integer dirams after validation. */
  @IsSomoniAmount()
  amount!: number;

  /** Defaults to today in Asia/Dushanbe. */
  @IsOptional()
  @IsCalendarDate()
  paidOn?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(1, 500)
  note?: string;
}
