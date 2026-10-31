import Link from "next/link";
import { Logo } from "@/components/daftar/Logo";
import { appNav } from "@/data/navigation";
import { getT } from "@/lib/i18n/server";

export async function LandingFooter() {
  const t = await getT();
  return (
    <footer className="flex flex-col gap-5 border-t-[1.5px] border-ink pt-6 md:flex-row md:items-center md:justify-between">
      <div>
        <Logo href="/" />
        <p className="mt-2 text-sm text-ink-2">{t("landing.footer.tagline")}</p>
      </div>
      <nav aria-label={t("landing.footer.navLabel")} className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
        {appNav.map((item) => (
          <Link key={item.href} href={item.href} className="text-ink hover:text-pen">
            {t(item.labelKey)}
          </Link>
        ))}
        <Link href="/app/new" className="text-ink hover:text-pen">
          {t("nav.newEntry")}
        </Link>
        <Link href="/pricing" className="text-ink hover:text-pen">
          {t("pricing.note")}
        </Link>
      </nav>
    </footer>
  );
}
