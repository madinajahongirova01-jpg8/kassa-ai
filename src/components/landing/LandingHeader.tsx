import Link from "next/link";
import { Logo } from "@/components/daftar/Logo";

const sections = [
  { label: "Чӣ тавр кор мекунад", href: "#chi-tavr" },
  { label: "Имкониятҳо", href: "#imkoniyatho" },
];

export function LandingHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <Logo href="/" />
      <nav aria-label="Қисмҳои саҳифа" className="hidden gap-1.5 rounded-full border-[1.5px] border-ink bg-card p-1 md:flex">
        {sections.map((item) => (
          <a key={item.href} href={item.href} className="rounded-full px-[18px] py-2 text-sm font-medium text-ink hover:text-pen">
            {item.label}
          </a>
        ))}
      </nav>
      <Link
        href="/app"
        className="rounded-full border-[1.5px] border-ink bg-ink px-4 py-2 text-sm font-semibold text-card hover:bg-pen hover:border-pen"
      >
        Дафтарро кушоед
      </Link>
    </header>
  );
}
