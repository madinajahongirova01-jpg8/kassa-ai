"use client";

import { useLocale, useT } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { isLocale, localeCookie, localeOptionLabel, LOCALES, type Locale } from "@/lib/i18n/config";

// A full reload, not router.refresh(): every page and the client router cache must come back in the new language.
function switchLocale(locale: Locale) {
  document.cookie = localeCookie(locale);
  window.location.reload();
}

// "daftar" matches the notebook pages (app, landing, pricing, login); "admin" matches the admin panel's palette.
const variants = {
  daftar: "border-[1.5px] border-ink bg-card text-ink hover:text-pen focus-visible:border-pen",
  admin: "border border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-container focus-visible:ring-1 focus-visible:ring-primary",
};

/** The one language select of the site; every page header renders it at its right end. */
export function LanguageSwitcher({ variant = "daftar", className }: { variant?: keyof typeof variants; className?: string }) {
  const current = useLocale();
  const t = useT();

  function choose(value: string) {
    if (isLocale(value) && value !== current) switchLocale(value);
  }

  return (
    <label className={cn("relative flex shrink-0 print:hidden", className)}>
      <span className="sr-only">{t("lang.label")}</span>
      <select
        value={current}
        onChange={(event) => choose(event.target.value)}
        className={cn("h-9 cursor-pointer appearance-none rounded-full pr-8 pl-3 text-sm font-semibold outline-none", variants[variant])}
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale} lang={locale}>
            {localeOptionLabel(locale)}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
        ▾
      </span>
    </label>
  );
}
