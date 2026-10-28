import Link from "next/link";
import { Logo } from "@/components/daftar/Logo";

export function PricingHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <Logo href="/" />
      <nav aria-label="Менюи сайт" className="hidden gap-1.5 rounded-full border-[1.5px] border-ink bg-card p-1 md:flex">
        <Link href="/" className="rounded-full px-[18px] py-2 text-sm font-medium text-ink hover:text-pen">
          Асосӣ
        </Link>
        <Link href="/pricing" aria-current="page" className="rounded-full bg-ink px-[18px] py-2 text-sm font-semibold text-card">
          Нархнома
        </Link>
      </nav>
      <Link
        href="/app"
        className="rounded-full border-[1.5px] border-ink bg-ink px-4 py-2 text-sm font-semibold text-card hover:border-pen hover:bg-pen"
      >
        Дафтарро кушоед
      </Link>
    </header>
  );
}
