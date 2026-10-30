import { HandNote } from "@/components/daftar/HandNote";
import { Marker } from "@/components/daftar/Marker";
import { useLocale, usePlural, useT } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";

export type NasiyaFormKind = "customer" | "debt";

const actionClass =
  "flex h-10 items-center rounded-tile border-[1.5px] border-ink px-3.5 font-display text-xs font-bold whitespace-nowrap text-ink shadow-hard hover:text-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm lg:h-[46px] lg:px-5 lg:text-sm";

type NasiyaHeadlineProps = {
  total: number;
  overdueCount: number;
  openForm: NasiyaFormKind | null;
  onOpenForm: (kind: NasiyaFormKind) => void;
};

export function NasiyaHeadline({ total, overdueCount, openForm, onOpenForm }: NasiyaHeadlineProps) {
  const t = useT();
  const plural = usePlural();
  const locale = useLocale();
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <HandNote className="inline-block -rotate-2 text-[26px] lg:text-[30px]">{t("nasiya.headline.lead")}</HandNote>
        <div className="mt-1 font-display leading-none font-extrabold tracking-[-0.03em]">
          <Marker className="px-1.5 text-[56px] lg:text-[76px]">{formatMoney(total, { unit: false, locale })}</Marker>
          <span className="ml-2 text-xl lg:ml-2.5 lg:text-[28px]">{t("nasiya.currency")}</span>
        </div>
        <div className="mt-2 font-display text-xl font-bold lg:text-[26px]">{t("nasiya.headline.tail")}</div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-3">
        {overdueCount > 0 && (
          <HandNote tone="red" className="rotate-3 text-[22px] leading-none lg:text-[26px]">
            {plural("nasiya.headline.late", overdueCount)}
          </HandNote>
        )}
        <div className="flex flex-col items-end gap-2 sm:flex-row">
          <button
            type="button"
            aria-expanded={openForm === "customer"}
            onClick={() => onOpenForm("customer")}
            className={cn(actionClass, "bg-card")}
          >
            {t("nasiya.headline.newCustomer")}
          </button>
          <button
            type="button"
            aria-expanded={openForm === "debt"}
            onClick={() => onOpenForm("debt")}
            className={cn(actionClass, "bg-marker")}
          >
            {t("nasiya.headline.newDebt")}
          </button>
        </div>
      </div>
    </div>
  );
}
