import { patchJson, postJson, type PostResult } from "@/lib/api/client";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";

export const MAX_PROFILE_TEXT = 100;
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 128;

const WRONG_CURRENT = "currentPassword is incorrect";
const SAME_PASSWORD = "newPassword must differ from currentPassword";

export type Send = <T>(url: string, body: unknown) => Promise<PostResult<T>>;
export type SettingsResult = { ok: true } | { ok: false; error: string };

export type ProfileForm = { businessName: string; name: string };
export type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;
export type PasswordForm = { current: string; next: string; repeat: string };
export type PasswordErrors = Partial<Record<keyof PasswordForm, string>>;

export function validateProfile({ businessName, name }: ProfileForm, locale: Locale = DEFAULT_LOCALE): ProfileErrors {
  const t = createT(locale);
  const errors: ProfileErrors = {};
  if (!businessName.trim()) errors.businessName = t("settings.errors.businessNameRequired");
  else if (businessName.trim().length > MAX_PROFILE_TEXT) errors.businessName = t("settings.errors.tooLong", { max: MAX_PROFILE_TEXT });
  if (name.trim().length > MAX_PROFILE_TEXT) errors.name = t("settings.errors.tooLong", { max: MAX_PROFILE_TEXT });
  return errors;
}

export function toProfilePayload({ businessName, name }: ProfileForm) {
  return { businessName: businessName.trim(), name: name.trim() || null };
}

export function validatePassword({ current, next, repeat }: PasswordForm, locale: Locale = DEFAULT_LOCALE): PasswordErrors {
  const t = createT(locale);
  const errors: PasswordErrors = {};
  if (!current) errors.current = t("settings.errors.currentRequired");
  if (next.length < MIN_PASSWORD) errors.next = t("settings.errors.tooShort", { min: MIN_PASSWORD });
  else if (next.length > MAX_PASSWORD) errors.next = t("settings.errors.passwordTooLong", { max: MAX_PASSWORD });
  else if (current && next === current) errors.next = t("settings.errors.same");
  if (!errors.next && repeat !== next) errors.repeat = t("settings.errors.mismatch");
  return errors;
}

export function settingsErrorText(status: number, details: string[], locale: Locale = DEFAULT_LOCALE): string {
  const t = createT(locale);
  if (status === 400 && details.includes(WRONG_CURRENT)) return t("settings.errors.currentWrong");
  if (status === 400 && details.includes(SAME_PASSWORD)) return t("settings.errors.same");
  if (status === 400) return t("settings.errors.invalid");
  if (status === 401) return t("settings.errors.session");
  if (status === 429) return t("settings.errors.tooMany");
  return t("settings.errors.server");
}

export async function saveProfile(form: ProfileForm, send: Send = patchJson, locale: Locale = DEFAULT_LOCALE): Promise<SettingsResult> {
  const errors = validateProfile(form, locale);
  const first = errors.businessName ?? errors.name;
  if (first) return { ok: false, error: first };
  const result = await send<unknown>("/api/auth/me", toProfilePayload(form));
  return result.ok ? { ok: true } : { ok: false, error: settingsErrorText(result.status, result.details, locale) };
}

export async function changePassword(form: PasswordForm, send: Send = postJson, locale: Locale = DEFAULT_LOCALE): Promise<SettingsResult> {
  const errors = validatePassword(form, locale);
  const first = errors.current ?? errors.next ?? errors.repeat;
  if (first) return { ok: false, error: first };
  const result = await send<unknown>("/api/auth/change-password", { currentPassword: form.current, newPassword: form.next });
  return result.ok ? { ok: true } : { ok: false, error: settingsErrorText(result.status, result.details, locale) };
}
