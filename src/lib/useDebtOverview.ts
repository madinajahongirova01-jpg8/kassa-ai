"use client";

import { useMemo } from "react";
import { buildDebtRows, debtTotals } from "@/lib/debts";
import { useDebtState } from "@/lib/debtStore";

export function useDebtOverview() {
  const { today, customers, events } = useDebtState();
  return useMemo(() => ({ totals: debtTotals(buildDebtRows(customers, events, today)) }), [today, customers, events]);
}
