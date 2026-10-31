import { Logo } from "@/components/daftar/Logo";
import { LogoutButton } from "@/components/daftar/LogoutButton";
import { NavPill } from "@/components/daftar/NavPill";
import { SampleDataBadge } from "@/components/daftar/SampleDataBadge";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export function AppTopBar() {
  return (
    <>
      <header className="hidden h-13 items-center gap-7 lg:flex print:hidden">
        <Logo />
        <NavPill />
        <SampleDataBadge />
        <div className="ml-auto flex items-center gap-2.5">
          <LogoutButton />
          <LanguageSwitcher />
        </div>
      </header>

      <header className="flex items-center justify-between gap-3 lg:hidden print:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <SampleDataBadge />
          <LogoutButton compact />
          <LanguageSwitcher />
        </div>
      </header>
    </>
  );
}
