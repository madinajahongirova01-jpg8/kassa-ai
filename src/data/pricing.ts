import type { MessageKey } from "@/lib/i18n/translate";

// Plan names, prices and descriptions are in the dictionaries under pricing.plans.<id>.
export type PlanId = "ogoz" | "tijorat" | "pro" | "shabaka";

export type Plan = {
  id: PlanId;
  main?: boolean;
};

export const plans: Plan[] = [{ id: "ogoz" }, { id: "tijorat", main: true }, { id: "pro" }, { id: "shabaka" }];

export const appFeatures: { titleKey: MessageKey; noteKey: MessageKey; href: string }[] = [
  { titleKey: "nav.newEntry", noteKey: "pricing.appFeatures.newEntry", href: "/app/new" },
  { titleKey: "nav.today", noteKey: "pricing.appFeatures.today", href: "/app" },
  { titleKey: "nav.ledger", noteKey: "pricing.appFeatures.ledger", href: "/app/transactions" },
  { titleKey: "nav.debts", noteKey: "pricing.appFeatures.debts", href: "/app/debts" },
  { titleKey: "nav.reports", noteKey: "pricing.appFeatures.reports", href: "/app/reports" },
];
