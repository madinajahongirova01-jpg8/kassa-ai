import Link from "next/link";
import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { getT } from "@/lib/i18n/server";

export async function LandingCta() {
  const t = await getT();
  return (
    <Card shadow="lg" className="flex flex-col items-center gap-6 rounded-[22px] px-5 py-8 text-center md:flex-row md:justify-between md:px-10 md:text-left">
      <div className="min-w-0">
        <h2 className="font-display text-[26px] leading-tight font-extrabold tracking-[-0.02em] lg:text-[34px]">{t("landing.cta.title")}</h2>
        <HandNote className="mt-1 inline-block -rotate-1 text-[22px]">{t("landing.cta.note")}</HandNote>
        <div className="mt-5">
          <Link
            href="/app"
            className="inline-flex rounded-tile border-[1.5px] border-ink bg-ink px-6 py-3 font-display text-base font-bold text-card shadow-hard hover:bg-pen hover:border-pen"
          >
            {t("landing.openBook")}
          </Link>
        </div>
      </div>
    </Card>
  );
}
