import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/daftar/PageState";
import { SettingsView } from "@/components/settings/SettingsView";
import { ApiLoadError, sessionGet } from "@/lib/api/session-data";
import type { ApiMe } from "@/lib/api/types";
import { getT } from "@/lib/i18n/server";
import type { TelegramLinkStatus } from "@/lib/telegramLink";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("settings.metaTitle") };
}

export default async function SettingsPage() {
  const t = await getT();
  return (
    <Suspense fallback={<PageLoading text={t("settings.loading")} />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const [{ user }, telegram] = await Promise.all([
    sessionGet<ApiMe>("/auth/me", "/app/settings"),
    // A Telegram status the API can't give right now must not hide the rest of the settings;
    // redirects (an expired session) still go through.
    sessionGet<TelegramLinkStatus>("/telegram/link", "/app/settings").catch((error: unknown) => {
      if (error instanceof ApiLoadError) return null;
      throw error;
    }),
  ]);
  return <SettingsView user={user} telegram={telegram} />;
}
