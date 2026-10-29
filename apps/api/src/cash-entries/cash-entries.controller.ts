import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import type { PublicUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Page } from '../common/pagination';
import { CashEntriesService, CashEntryResponse } from './cash-entries.service';
import { CreateCashEntriesDto } from './dto/create-cash-entries.dto';
import { ListCashEntriesQueryDto } from './dto/list-cash-entries-query.dto';

@Controller('cash-entries')
@UseGuards(JwtAuthGuard)
export class CashEntriesController {
  constructor(private readonly entries: CashEntriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: PublicUser, @Body() dto: CreateCashEntriesDto): Promise<CashEntryResponse[]> {
    return this.entries.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: PublicUser, @Query() query: ListCashEntriesQueryDto): Promise<Page<CashEntryResponse>> {
    return this.entries.list(user.id, query);
  }
}
