import Link from "next/link";
import { Logo } from "@/components/daftar/Logo";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { getT } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/translate";

const sections: { labelKey: MessageKey; href: string }[] = [
  { labelKey: "landing.nav.howItWorks", href: "#chi-tavr" },
  { labelKey: "landing.nav.features", href: "#imkoniyatho" },
];

export async function LandingHeader() {
  const t = await getT();
  return (
    <header className="flex items-center justify-between gap-4">
      <Logo href="/" />
      <nav aria-label={t("landing.nav.label")} className="hidden gap-1.5 rounded-full border-[1.5px] border-ink bg-card p-1 md:flex">
        {sections.map((item) => (
          <a key={item.href} href={item.href} className="rounded-full px-[18px] py-2 text-sm font-medium text-ink hover:text-pen">
            {t(item.labelKey)}
          </a>
        ))}
      </nav>
      {/* The language select is always last, in the top right corner. On narrow phones the button
          gives way to it; the same action is right below in the hero. */}
      <div className="flex shrink-0 items-center justify-end gap-2">
        <Link
          href="/app"
          className="hidden rounded-full border-[1.5px] border-ink bg-ink px-4 py-2 text-sm font-semibold text-card hover:bg-pen hover:border-pen sm:block"
        >
          {t("landing.openBook")}
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
