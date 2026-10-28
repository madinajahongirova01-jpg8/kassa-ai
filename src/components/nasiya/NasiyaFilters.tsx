import { cn } from "@/lib/cn";
import type { StatusFilter } from "@/lib/debts";

const chips: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Ҳама" },
  { id: "near", label: "Мӯҳлат наздик" },
  { id: "overdue", label: "Гузашта" },
  { id: "paid", label: "Пардохт шуд" },
];

function chipClass(id: StatusFilter, active: boolean) {
  if (id === "overdue") return active ? "border-red bg-red font-semibold text-card" : "border-red bg-card font-semibold text-red";
  return active ? "border-ink bg-ink font-semibold text-card" : "border-ink bg-card text-ink hover:text-pen";
}

type NasiyaFiltersProps = {
  counts: Record<StatusFilter, number>;
  filter: StatusFilter;
  onFilter: (filter: StatusFilter) => void;
  query: string;
  onQuery: (query: string) => void;
};

export function NasiyaFilters({ counts, filter, onFilter, query, onQuery }: NasiyaFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="no-scrollbar -mx-[18px] flex gap-2 overflow-x-auto px-[18px] lg:mx-0 lg:flex-wrap lg:px-0">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            aria-pressed={filter === chip.id}
            onClick={() => onFilter(chip.id)}
            className={cn("h-9 shrink-0 rounded-full border-[1.5px] px-3.5 whitespace-nowrap", chipClass(chip.id, filter === chip.id))}
          >
            {chip.label} · {counts[chip.id]}
          </button>
        ))}
      </div>
      <label className="lg:ml-auto">
        <span className="sr-only">Ҷустуҷӯи муштарӣ</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Ном ё рақам…"
          className="h-9 w-full rounded-full border-[1.5px] border-ink bg-card px-3.5 text-[13px] text-ink outline-none placeholder:text-ink-3 focus:border-pen lg:w-[200px]"
        />
      </label>
    </div>
  );
}
