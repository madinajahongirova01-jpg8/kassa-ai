import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { DebtStatus } from '../../generated/prisma/enums';

const DEBT_STATUSES = Object.values(DebtStatus);

export class ListDebtsQueryDto {
  @IsOptional()
  @IsIn(DEBT_STATUSES, { message: `status must be one of: ${DEBT_STATUSES.join(', ')}` })
  status?: DebtStatus;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
