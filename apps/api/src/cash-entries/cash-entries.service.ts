import { BadRequestException, Injectable } from '@nestjs/common';
import { calendarDateFilter } from '../common/date-range.dto';
import { formatCalendarDate, parseCalendarDate, todayInBusinessTimeZone } from '../common/dates';
import { formatDirams } from '../common/money';
import { decodeCursor, DEFAULT_PAGE_SIZE, Page, toPage } from '../common/pagination';
import { CashEntry } from '../generated/prisma/client';
import { CashCategory, CashEntryKind, EntrySource } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashEntriesDto } from './dto/create-cash-entries.dto';
import { ListCashEntriesQueryDto } from './dto/list-cash-entries-query.dto';

export interface CashEntryResponse {
  id: string;
  kind: CashEntryKind;
  category: CashCategory;
  amount: string;
  title: string;
  occurredOn: string;
  source: EntrySource;
  createdAt: Date;
}

function toCashEntryResponse(entry: CashEntry): CashEntryResponse {
  return {
    id: entry.id,
    kind: entry.kind,
    category: entry.category,
    amount: formatDirams(entry.amountDirams),
    title: entry.title,
    occurredOn: formatCalendarDate(entry.occurredOn),
    source: entry.source,
    createdAt: entry.createdAt,
  };
}

// Every query is scoped by ownerId: other users' entries behave as if they did not exist.
@Injectable()
export class CashEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Saves all entries of one receipt in a single transaction. */
  async create(ownerId: string, dto: CreateCashEntriesDto): Promise<CashEntryResponse[]> {
    const today = todayInBusinessTimeZone();
    const errors = dto.entries
      .map((entry, index) => (entry.occurredOn !== undefined && entry.occurredOn > today ? index : -1))
      .filter((index) => index >= 0)
      .map((index) => `entries.${index}.occurredOn must not be in the future`);
    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Validation failed', details: errors });
    }

    const created = await this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.prisma.cashEntry.create({
          data: {
            ownerId,
            kind: entry.kind,
            category: entry.category,
            amountDirams: entry.amount,
            title: entry.title,
            occurredOn: parseCalendarDate(entry.occurredOn ?? today),
            source: entry.source,
          },
        }),
      ),
    );
    return created.map(toCashEntryResponse);
  }

  /** Entries newest first, optionally limited to an inclusive occurredOn range and a kind. */
  async list(ownerId: string, query: ListCashEntriesQueryDto): Promise<Page<CashEntryResponse>> {
    const occurredOn = calendarDateFilter(query.from, query.to);
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const cursor = query.cursor === undefined ? undefined : decodeCursor(query.cursor);
    const cursorDate = cursor === undefined ? undefined : parseCalendarDate(cursor.date);

    const entries = await this.prisma.cashEntry.findMany({
      where: {
        ownerId,
        kind: query.kind,
        occurredOn,
        OR:
          cursor === undefined || cursorDate === undefined
            ? undefined
            : [
                { occurredOn: { lt: cursorDate } },
                { occurredOn: cursorDate, createdAt: { lt: cursor.createdAt } },
                { occurredOn: cursorDate, createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
      },
      orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    return toPage(
      entries,
      limit,
      (entry) => ({ date: formatCalendarDate(entry.occurredOn), createdAt: entry.createdAt, id: entry.id }),
      toCashEntryResponse,
    );
  }
}
