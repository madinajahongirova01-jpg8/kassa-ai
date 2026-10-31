import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/daftar/PageState";
import { SettingsView } from "@/components/settings/SettingsView";
import { sessionGet } from "@/lib/api/session-data";
import type { ApiMe } from "@/lib/api/types";
import { getT } from "@/lib/i18n/server";

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
  const { user } = await sessionGet<ApiMe>("/auth/me", "/app/settings");
  return <SettingsView user={user} />;
}
