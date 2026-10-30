import type { Metadata } from "next";
import { StatusPage } from "@/components/daftar/StatusPage";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("pages.notFound.metaTitle") };
}

// Shown for unknown addresses (through [...rest]) and for notFound() anywhere under [lang].
export default async function NotFound() {
  const t = await getT();
  return (
    <StatusPage
      note={t("pages.notFound.note")}
      title={t("pages.notFound.title")}
      text={t("pages.notFound.text")}
      homeText={t("pages.home")}
    />
  );
}
