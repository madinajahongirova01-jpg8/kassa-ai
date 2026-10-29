import { IsCalendarDate } from '../../common/validators';

export class ReportSummaryQueryDto {
  @IsCalendarDate()
  from!: string;

  @IsCalendarDate()
  to!: string;
}
