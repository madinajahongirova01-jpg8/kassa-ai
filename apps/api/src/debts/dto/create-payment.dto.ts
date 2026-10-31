import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { trimString } from '../../auth/dto/normalize';
import { IsCalendarDate, IsSomoniAmount } from '../../common/validators';
import { PaymentMethod } from '../../generated/prisma/enums';

const METHODS = Object.values(PaymentMethod);

export class CreatePaymentDto {
  /** Sent as somoni ("150.50"); holds integer dirams after validation. */
  @IsSomoniAmount()
  amount!: number;

  @IsOptional()
  @IsIn(METHODS, { message: `method must be one of: ${METHODS.join(', ')}` })
  method?: PaymentMethod;

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
