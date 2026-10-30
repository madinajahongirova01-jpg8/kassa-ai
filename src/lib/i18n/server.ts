import { lang } from "next/root-params";
import { resolveLocale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";

// Server Components only: the locale is the internal [lang] segment the proxy chose from the cookie.
export async function getLocale() {
  return resolveLocale(await lang());
}

export async function getT() {
  return createT(await getLocale());
}
