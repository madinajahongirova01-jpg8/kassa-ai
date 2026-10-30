"use client";

import { useEffect, useSyncExternalStore } from "react";
import { fontVariables } from "@/app/fonts";
import { StatusPage, statusActionClass } from "@/components/daftar/StatusPage";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { DEFAULT_LOCALE, localeFromCookies } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";
import "./globals.css";

function subscribe() {
  return () => {};
}

// Replaces the root layout when it fails, so there is no [lang] segment: the language comes from
// the same kassa_lang cookie in the browser (Tajik while rendering on the server).
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const locale = useSyncExternalStore(subscribe, () => localeFromCookies(document.cookie), () => DEFAULT_LOCALE);
  const t = createT(locale);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full bg-notebook font-body-md text-ink" suppressHydrationWarning>
        <title>{t("pages.error.metaTitle")}</title>
        <I18nProvider locale={locale}>
          <StatusPage
            note={t("pages.error.note")}
            title={t("pages.error.title")}
            text={t("pages.error.text")}
            homeText={t("pages.home")}
            action={
              <button type="button" onClick={retry} className={statusActionClass}>
                {t("common.error.retry")}
              </button>
            }
          />
        </I18nProvider>
      </body>
    </html>
  );
}
