import Link from "next/link";
import { Logo } from "@/components/daftar/Logo";
import { appNav } from "@/data/navigation";

export function LandingFooter() {
  return (
    <footer className="flex flex-col gap-5 border-t-[1.5px] border-ink pt-6 md:flex-row md:items-center md:justify-between">
      <div>
        <Logo href="/" />
        <p className="mt-2 text-sm text-ink-2">Дафтари рақамӣ барои тиҷорати хурди Тоҷикистон.</p>
      </div>
      <nav aria-label="Саҳифаҳои барнома" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
        {appNav.map((item) => (
          <Link key={item.href} href={item.href} className="text-ink hover:text-pen">
            {item.label}
          </Link>
        ))}
        <Link href="/app/new" className="text-ink hover:text-pen">
          Сабти нав
        </Link>
      </nav>
    </footer>
  );
}
