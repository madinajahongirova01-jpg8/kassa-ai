import { deleteJson, postJson, type PostResult } from "@/lib/api/client";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";

// Same code alphabet and length as the bot (apps/api/src/telegram/bot/services/link-code.ts);
// checking the format here keeps a typo from using up one of the API's limited attempts.
const CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;
const ATTEMPTS_LEFT = /^attemptsLeft: (\d+)$/;
export const MAX_LINK_CODE = 32;
/** How long a code from the bot's /link command stays valid (LINK_CODE_MINUTES in the API). */
export const LINK_CODE_MINUTES = 10;

export type TelegramLinkStatus = { linked: boolean; linkedAt: string | null };
export type LinkResult = { ok: true; status: TelegramLinkStatus } | { ok: false; error: string };
export type UnlinkResult = { ok: true } | { ok: false; error: string };
type Post = <T>(url: string, body: unknown) => Promise<PostResult<T>>;
type Delete = <T>(url: string) => Promise<PostResult<T>>;

/** "abcd efgh" or "ABCD-EFGH" → "ABCDEFGH", like the bot reads it. */
export function normalizeLinkCode(input: string) {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

export function validateLinkCode(input: string, locale: Locale = DEFAULT_LOCALE): string | undefined {
  const t = createT(locale);
  const code = normalizeLinkCode(input);
  if (!code) return t("settings.telegram.errors.codeRequired");
  if (!CODE_PATTERN.test(code)) return t("settings.telegram.errors.codeFormat");
  return undefined;
}

export function telegramErrorText(status: number, details: string[], locale: Locale = DEFAULT_LOCALE): string {
  const t = createT(locale);
  if (status === 400) {
    const left = details.map((d) => ATTEMPTS_LEFT.exec(d)?.[1]).find(Boolean);
    const invalid = t("settings.telegram.errors.invalid");
    return left === undefined ? invalid : `${invalid} ${t("settings.telegram.errors.attemptsLeft", { count: Number(left) })}`;
  }
  if (status === 409) return t("settings.telegram.errors.conflict");
  if (status === 429) return t("settings.telegram.errors.tooMany");
  if (status === 401) return t("settings.errors.session");
  if (status === 0) return t("settings.telegram.errors.network");
  return t("settings.errors.server");
}

function readStatus(data: unknown): TelegramLinkStatus | null {
  const { linked, linkedAt } = (data ?? {}) as Partial<TelegramLinkStatus>;
  if (typeof linked !== "boolean" || (linkedAt !== null && typeof linkedAt !== "string")) return null;
  return { linked, linkedAt };
}

export async function linkTelegram(input: string, send: Post = postJson, locale: Locale = DEFAULT_LOCALE): Promise<LinkResult> {
  const invalid = validateLinkCode(input, locale);
  if (invalid) return { ok: false, error: invalid };
  const result = await send<unknown>("/api/telegram/link", { code: normalizeLinkCode(input) });
  if (!result.ok) return { ok: false, error: telegramErrorText(result.status, result.details, locale) };
  const status = readStatus(result.data);
  return status?.linked ? { ok: true, status } : { ok: false, error: telegramErrorText(500, [], locale) };
}

export async function unlinkTelegram(send: Delete = deleteJson, locale: Locale = DEFAULT_LOCALE): Promise<UnlinkResult> {
  const result = await send<unknown>("/api/telegram/link");
  return result.ok ? { ok: true } : { ok: false, error: telegramErrorText(result.status, result.details, locale) };
}
