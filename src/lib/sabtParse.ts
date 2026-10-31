import { postJson, type PostResult } from "@/lib/api/client";
import { DIRAMS_PER_SOMONI, parseSomoniInput } from "@/lib/money";
import { parseSabt, SABT_CATEGORIES, SABT_KINDS, type SabtCategory, type SabtEntry, type SabtKind } from "@/lib/sabt";

export const MAX_PARSE_TEXT = 1000;

export type ParseSource = "ai" | "rules";

export type ParsedText = { source: ParseSource; entries: SabtEntry[] };

export type ApiParsedEntry = { kind: SabtKind; category: SabtCategory; title: string; amountDirams: number };

export type ApiParseResult = { source: ParseSource; entries: ApiParsedEntry[] };

type Post = <T>(url: string, body: unknown) => Promise<PostResult<T>>;

const NUMBER_IN_TEXT = /\d+(?:[.,]\d{1,2})?/g;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isApiEntry(value: unknown): value is ApiParsedEntry {
  return (
    isRecord(value) &&
    SABT_KINDS.some((kind) => kind === value.kind) &&
    SABT_CATEGORIES.some((category) => category === value.category) &&
    typeof value.title === "string" &&
    typeof value.amountDirams === "number" &&
    Number.isSafeInteger(value.amountDirams) &&
    value.amountDirams >= 0
  );
}

function isApiResult(value: unknown): value is ApiParseResult {
  return isRecord(value) && (value.source === "ai" || value.source === "rules") && Array.isArray(value.entries) && value.entries.every(isApiEntry);
}

function numbersInText(text: string) {
  return [...text.matchAll(NUMBER_IN_TEXT)].map((match) => ({ dirams: parseSomoniInput(match[0]), start: match.index, end: match.index + match[0].length }));
}

export function rulesResult(text: string): ParsedText {
  return { source: "rules", entries: parseSabt(text) };
}

export function toParsedText(text: string, result: ApiParseResult): ParsedText {
  const numbers = numbersInText(text);
  const used = new Set<number>();
  const entries = result.entries.map((entry, index): SabtEntry => {
    const found = numbers.findIndex((number, position) => !used.has(position) && number.dirams === entry.amountDirams);
    if (found >= 0) used.add(found);
    const place = found >= 0 ? numbers[found] : { start: 0, end: 0 };
    return {
      id: `a${index + 1}`,
      title: entry.title,
      note: entry.kind === "debt" ? "насия" : "",
      kind: entry.kind,
      category: entry.category,
      amount: entry.amountDirams / DIRAMS_PER_SOMONI,
      start: place.start,
      end: place.end,
    };
  });
  return { source: result.source, entries };
}

export function shouldAskServer(text: string) {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_PARSE_TEXT && /\d/.test(trimmed);
}

export async function parseOnServer(text: string, post: Post = postJson): Promise<ParsedText> {
  if (!shouldAskServer(text)) return rulesResult(text);
  const response = await post<unknown>("/api/entries/parse", { text: text.trim() });
  if (!response.ok || !isApiResult(response.data)) return rulesResult(text);
  return toParsedText(text, response.data);
}
