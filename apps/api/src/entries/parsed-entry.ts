import { MAX_AMOUNT_DIRAMS, parseSomoni } from '../common/money';
import { isDebtText, parseSabt, SABT_CATEGORIES, SABT_KINDS, SabtCategory, SabtKind } from './rules/sabt-rules';

export const MAX_PARSED_ENTRIES = 50;
const MAX_TITLE_LENGTH = 200;
const NUMBER_IN_TEXT = /\d+(?:[.,]\d{1,2})?/g;
const CONTROL_CHARACTERS = /\p{Cc}/gu;

export type ParseSource = 'ai' | 'rules';

export interface ParsedEntryResponse {
  kind: SabtKind;
  category: SabtCategory;
  title: string;
  amountDirams: number;
}

export interface ParseResultResponse {
  source: ParseSource;
  entries: ParsedEntryResponse[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isKind(value: unknown): value is SabtKind {
  return SABT_KINDS.some((kind) => kind === value);
}

function isCategory(value: unknown): value is SabtCategory {
  return SABT_CATEGORIES.some((category) => category === value);
}

function amountsInText(text: string): Set<number> {
  const amounts = new Set<number>();
  for (const match of text.matchAll(NUMBER_IN_TEXT)) {
    const dirams = parseSomoni(match[0].replace(',', '.'));
    if (dirams !== undefined) amounts.add(dirams);
  }
  return amounts;
}

function cleanTitle(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const title = value.replace(CONTROL_CHARACTERS, ' ').replace(/\s+/g, ' ').trim();
  return title.length > 0 && title.length <= MAX_TITLE_LENGTH ? title : null;
}

function readEntry(value: unknown, allowedAmounts: Set<number>): ParsedEntryResponse | null {
  if (!isRecord(value) || !isKind(value.kind) || !isCategory(value.category)) return null;
  const title = cleanTitle(value.title);
  const amountDirams = typeof value.amount === 'number' ? parseSomoni(value.amount) : undefined;
  if (title === null || amountDirams === undefined) return null;
  if (amountDirams < 1 || amountDirams > MAX_AMOUNT_DIRAMS || !allowedAmounts.has(amountDirams)) return null;
  const debt = value.kind === 'debt' || isDebtText(title);
  return {
    kind: debt ? 'debt' : value.kind,
    category: debt ? 'OTHER' : value.category,
    title,
    amountDirams,
  };
}

export function rulesEntries(text: string): ParsedEntryResponse[] {
  return parseSabt(text)
    .map((entry) => ({ kind: entry.kind, category: entry.category, title: entry.title, amountDirams: entry.amount * 100 }))
    .filter((entry) => entry.amountDirams <= MAX_AMOUNT_DIRAMS)
    .slice(0, MAX_PARSED_ENTRIES);
}

export function readAiEntries(raw: unknown, text: string): ParsedEntryResponse[] | null {
  if (!isRecord(raw) || !Array.isArray(raw.entries) || raw.entries.length > MAX_PARSED_ENTRIES) return null;
  const allowedAmounts = amountsInText(text);
  const entries: ParsedEntryResponse[] = [];
  for (const item of raw.entries) {
    const entry = readEntry(item, allowedAmounts);
    if (entry === null) return null;
    entries.push(entry);
  }
  if (entries.length === 0 && rulesEntries(text).length > 0) return null;
  return entries;
}
