import { Marker } from "@/components/daftar/Marker";
import { formatMoney, MINUS } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translate";

type TodaySummaryProps = {
  income: number;
  expense: number;
};

export async function TodaySummary({ income, expense }: TodaySummaryProps) {
  const locale = await getLocale();
  const t = createT(locale);
  const profit = income - expense;
  const gain = profit >= 0;
  return (
    <div className="min-w-0">
      <div className="font-display text-xl font-bold text-ink-2 lg:text-[28px]">{t("today.summary.lead")}</div>
      <div className="mt-1.5 font-display leading-none font-extrabold tracking-[-0.03em]">
        <Marker className="px-1 text-[62px] lg:px-1.5 lg:text-[76px] xl:text-[104px]">{formatMoney(profit, { sign: true, unit: false, locale })}</Marker>
        <span className="ml-2.5 hidden text-[32px] lg:inline">{t("today.summary.currency")}</span>
      </div>
      <div className="mt-2 font-display text-xl font-bold lg:mt-2.5 lg:text-[34px]">
        <span className="lg:hidden">{t("today.summary.currency")} </span>
        {gain ? t("today.summary.gained") : t("today.summary.lost")}
      </div>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base text-ink lg:mt-4 lg:text-lg">
        <span>
          {t("today.summary.income")} <b className="text-green">{formatMoney(income, { unit: false, locale })}</b>
        </span>
        <span aria-hidden>{MINUS}</span>
        <span>
          {t("today.summary.expense")} <b className="text-red">{formatMoney(expense, { unit: false, locale })}</b>
        </span>
        <span aria-hidden>=</span>
        <span>
          {gain ? t("today.summary.profit") : t("today.summary.loss")}{" "}
          <Marker className="px-1 font-bold">{formatMoney(Math.abs(profit), { unit: false, locale })}</Marker>
        </span>
      </p>
    </div>
  );
}
