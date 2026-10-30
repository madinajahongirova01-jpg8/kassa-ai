"use client";

import { useEffect } from "react";
import { StatusPage, statusActionClass } from "@/components/daftar/StatusPage";
import { useT } from "@/components/i18n/I18nProvider";

// Errors on the landing, pricing, login and admin pages; /app has its own error boundaries.
export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
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
  );
}
