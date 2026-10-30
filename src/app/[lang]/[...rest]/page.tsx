import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";

// Every address without its own page lands here, so the 404 renders inside the [lang] layout
// with the chosen language, fonts and the language select.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("pages.notFound.metaTitle") };
}

// One prerendered path per language; any other address renders on request. Awaiting params
// before notFound() makes that a full server render, so the 404 HTML (not an empty shell) is sent.
export function generateStaticParams() {
  return [{ rest: ["404"] }];
}

export default async function UnknownPage({ params }: PageProps<"/[lang]/[...rest]">) {
  await params;
  notFound();
}
