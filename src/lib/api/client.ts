import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";

// Browser-side calls to our own Route Handlers (/api/...). The session token stays in the httpOnly
// cookie: the browser sends it, but JavaScript never reads it.

export type PostResult<T> = { ok: true; data: T } | { ok: false; status: number; details: string[] };

export function postJson<T = unknown>(url: string, body: unknown): Promise<PostResult<T>> {
  return sendJson<T>("POST", url, body);
}

export function patchJson<T = unknown>(url: string, body: unknown): Promise<PostResult<T>> {
  return sendJson<T>("PATCH", url, body);
}

async function sendJson<T>(method: "POST" | "PATCH", url: string, body: unknown): Promise<PostResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data: unknown = await response.json().catch(() => null);
    if (response.ok) return { ok: true, data: data as T };
    const details = (data as { details?: unknown } | null)?.details;
    return { ok: false, status: response.status, details: Array.isArray(details) ? details.filter((d) => typeof d === "string") : [] };
  } catch {
    return { ok: false, status: 0, details: [] };
  }
}

const REMAINING = /^remainingAmount: (\d+\.\d{2})$/;

export function requestErrorText(status: number, details: string[] = [], locale: Locale = DEFAULT_LOCALE) {
  const t = createT(locale);
  if (status === 422) {
    const remaining = details.map((d) => REMAINING.exec(d)?.[1]).find(Boolean);
    return remaining ? t("nasiya.errors.overpaid", { remaining }) : t("nasiya.errors.paymentRefused");
  }
  if (status === 429) return t("nasiya.errors.tooMany");
  if (status === 401) return t("nasiya.errors.session");
  if (status === 404) return t("nasiya.errors.recordNotFound");
  if (status === 400) return t("nasiya.errors.checkData");
  if (status === 403) return t("nasiya.errors.forbidden");
  return t("nasiya.errors.server");
}
