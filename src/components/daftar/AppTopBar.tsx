import { Logo } from "@/components/daftar/Logo";
import { NavPill } from "@/components/daftar/NavPill";
import { DemoBadge } from "@/components/ui/DemoBadge";

export function AppTopBar() {
  return (
    <>
      <header className="hidden h-13 items-center gap-7 lg:flex">
        <Logo />
        <NavPill />
        <DemoBadge />
      </header>

      <header className="flex items-center justify-between gap-3 lg:hidden">
        <Logo />
        <DemoBadge />
      </header>
    </>
  );
}
