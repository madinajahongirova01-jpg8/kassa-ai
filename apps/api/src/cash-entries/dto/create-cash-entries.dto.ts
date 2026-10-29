import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { trimString } from '../../auth/dto/normalize';
import { IsCalendarDate, IsSomoniAmount } from '../../common/validators';
import { CashCategory, CashEntryKind, EntrySource } from '../../generated/prisma/enums';

export const MAX_ENTRIES_PER_REQUEST = 50;

const KINDS = Object.values(CashEntryKind);
const CATEGORIES = Object.values(CashCategory);
const SOURCES = Object.values(EntrySource);

export class CreateCashEntryDto {
  @IsIn(KINDS, { message: `kind must be one of: ${KINDS.join(', ')}` })
  kind!: CashEntryKind;

  @IsIn(CATEGORIES, { message: `category must be one of: ${CATEGORIES.join(', ')}` })
  category!: CashCategory;

  /** Sent as somoni ("150.50"); holds integer dirams after validation. */
  @IsSomoniAmount()
  amount!: number;

  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(1, 200)
  title!: string;

  /** Defaults to today in Asia/Dushanbe. */
  @IsOptional()
  @IsCalendarDate()
  occurredOn?: string;

  @IsIn(SOURCES, { message: `source must be one of: ${SOURCES.join(', ')}` })
  source!: EntrySource;
}

/** One receipt: all entries are saved together or not at all. */
export class CreateCashEntriesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ENTRIES_PER_REQUEST)
  @ValidateNested({ each: true })
  @Type(() => CreateCashEntryDto)
  entries!: CreateCashEntryDto[];
}
