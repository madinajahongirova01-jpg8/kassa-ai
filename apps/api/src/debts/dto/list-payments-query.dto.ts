import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { DateRangePageQueryDto } from '../../common/date-range.dto';

export class ListPaymentsQueryDto extends DateRangePageQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  includeCancelled?: boolean;
}
