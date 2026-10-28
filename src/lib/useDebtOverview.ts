"use client";

import { useMemo } from "react";
import type { DueDebt } from "@/data/types";
import { buildDebtRows, debtTotals, dueLabel, isUrgent } from "@/lib/debts";
import { useDebtState } from "@/lib/debtStore";

export function useDebtOverview() {
  const { customers, events } = useDebtState();
  return useMemo(() => {
    const rows = buildDebtRows(customers, events);
    const dueSoon: DueDebt[] = rows
      .filter((row) => row.status === "near")
      .sort((a, b) => (a.customer.dueDate ?? "").localeCompare(b.customer.dueDate ?? ""))
      .map(({ customer, balance }) => {
        const urgent = isUrgent(customer, balance);
        const label = dueLabel(customer, balance);
        return {
          id: customer.id,
          name: customer.name,
          initials: customer.initials,
          phone: customer.phone,
          amount: balance,
          due: label,
          dueShort: label,
          urgent,
          avatarClassName: urgent ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-secondary-container text-on-secondary-container",
          dueClassName: urgent ? "text-tertiary" : "text-secondary",
        };
      });
    return { totals: debtTotals(rows), dueSoon };
  }, [customers, events]);
}
