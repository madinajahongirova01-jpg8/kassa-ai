import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { parseCalendarDate } from './dates';
import { IsCalendarDate } from './validators';
import { MAX_PAGE_SIZE } from './pagination';

/** Prisma filter for an inclusive DATE range; throws 400 when `from` is after `to`. */
export function calendarDateFilter(from?: string, to?: string): { gte?: Date; lte?: Date } | undefined {
  if (from !== undefined && to !== undefined && from > to) {
    throw new BadRequestException({ message: 'Validation failed', details: ['from must not be later than to'] });
  }
  if (from === undefined && to === undefined) {
    return undefined;
  }
  return {
    gte: from === undefined ? undefined : parseCalendarDate(from),
    lte: to === undefined ? undefined : parseCalendarDate(to),
  };
}

/** Shared query for paginated lists filtered by an inclusive calendar date range. */
export class DateRangePageQueryDto {
  @IsOptional()
  @IsCalendarDate()
  from?: string;

  @IsOptional()
  @IsCalendarDate()
  to?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value))
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}
