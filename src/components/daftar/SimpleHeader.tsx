import { Logo } from "@/components/daftar/Logo";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

/**
 * Logo on the left, the language select in the top right corner: the header of login, 404 and
 * error pages. It spans the same width and padding as the app's top bar, so the select sits in the
 * same corner on every page while the page content below keeps its narrow column.
 */
export function SimpleHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-[18px] pt-[18px] lg:px-7 lg:pt-[22px]">
      <Logo href="/" />
      <LanguageSwitcher />
    </header>
  );
}
