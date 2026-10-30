import { Logo } from "@/components/daftar/Logo";
import { NavPill } from "@/components/daftar/NavPill";
import { SampleDataBadge } from "@/components/daftar/SampleDataBadge";

export function AppTopBar() {
  return (
    <>
      <header className="hidden h-13 items-center gap-7 lg:flex print:hidden">
        <Logo />
        <NavPill />
        <SampleDataBadge />
      </header>

      <header className="flex items-center justify-between gap-3 lg:hidden print:hidden">
        <Logo />
        <SampleDataBadge />
      </header>
    </>
  );
}
