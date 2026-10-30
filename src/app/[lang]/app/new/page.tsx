import type { Metadata } from "next";
import { SabtView } from "@/components/sabt/SabtView";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("sabt.metaTitle") };
}

export default function NewRecordPage() {
  return <SabtView />;
}
