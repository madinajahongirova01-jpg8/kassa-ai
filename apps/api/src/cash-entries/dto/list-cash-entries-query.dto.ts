import { IsIn, IsOptional } from 'class-validator';
import { DateRangePageQueryDto } from '../../common/date-range.dto';
import { CashEntryKind } from '../../generated/prisma/enums';

const KINDS = Object.values(CashEntryKind);

export class ListCashEntriesQueryDto extends DateRangePageQueryDto {
  @IsOptional()
  @IsIn(KINDS, { message: `kind must be one of: ${KINDS.join(', ')}` })
  kind?: CashEntryKind;
}
