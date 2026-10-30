import Link from "next/link";
import { Logo } from "@/components/daftar/Logo";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { getT } from "@/lib/i18n/server";

export async function PricingHeader() {
  const t = await getT();
  return (
    <header className="flex items-center justify-between gap-4">
      <Logo href="/" />
      <nav aria-label={t("pricing.nav.label")} className="hidden gap-1.5 rounded-full border-[1.5px] border-ink bg-card p-1 md:flex">
        <Link href="/" className="rounded-full px-[18px] py-2 text-sm font-medium text-ink hover:text-pen">
          {t("pricing.nav.home")}
        </Link>
        <Link href="/pricing" aria-current="page" className="rounded-full bg-ink px-[18px] py-2 text-sm font-semibold text-card">
          {t("pricing.note")}
        </Link>
      </nav>
      {/* Same as the landing header: the language select stays last, in the top right corner. */}
      <div className="flex shrink-0 items-center justify-end gap-2">
        <Link
          href="/app"
          className="hidden rounded-full border-[1.5px] border-ink bg-ink px-4 py-2 text-sm font-semibold text-card hover:border-pen hover:bg-pen sm:block"
        >
          {t("landing.openBook")}
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
