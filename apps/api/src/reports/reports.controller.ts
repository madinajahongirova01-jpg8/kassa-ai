import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { PublicUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportSummaryQueryDto } from './dto/report-summary-query.dto';
import { ReportsService, ReportSummaryResponse } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('summary')
  summary(@CurrentUser() user: PublicUser, @Query() query: ReportSummaryQueryDto): Promise<ReportSummaryResponse> {
    return this.reports.summary(user.id, query);
  }
}
