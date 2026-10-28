import { Avatar } from "@/components/daftar/Avatar";
import { Logo, LogoMark } from "@/components/daftar/Logo";
import { NavPill } from "@/components/daftar/NavPill";
import { currentBusiness } from "@/data/business";

export function AppTopBar() {
  const { shortName, owner, todayLong, todayShort } = currentBusiness;
  return (
    <>
      <header className="hidden h-[52px] items-center justify-between gap-5 lg:flex">
        <div className="flex items-center gap-7">
          <Logo />
          <NavPill />
        </div>
        <div className="flex items-center gap-3.5">
          <div className="text-right">
            <div className="text-sm font-semibold">{shortName}</div>
            <div className="text-xs text-ink-2">{todayLong} · маълумоти намунавӣ</div>
          </div>
          <Avatar initials={owner.initials} />
        </div>
      </header>

      <header className="flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <LogoMark size="sm" />
          <div>
            <div className="text-sm font-bold">{shortName}</div>
            <div className="text-[11px] text-ink-2">{todayShort} · намуна</div>
          </div>
        </div>
        <Avatar initials={owner.initials} size="sm" />
      </header>
    </>
  );
}
