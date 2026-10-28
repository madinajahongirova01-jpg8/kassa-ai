import { FilterSelect } from "@/components/transactions/FilterSelect";
import { Icon } from "@/components/ui/Icon";
import { categories, sources, type LedgerEntry } from "@/data/transactions";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";
import { formatLedgerDate, type SortOrder } from "@/lib/ledger";

export const PAGE_SIZE = 7;

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Аз рӯи вақт (навтарин)" },
  { value: "oldest", label: "Аз рӯи вақт (кӯҳнатарин)" },
  { value: "amount", label: "Аз рӯи маблағ (калонтарин)" },
];

type LedgerTableProps = {
  entries: LedgerEntry[];
  total: number;
  turnover: number;
  page: number;
  pageCount: number;
  sort: SortOrder;
  selectedId: string | null;
  onSort: (sort: SortOrder) => void;
  onPage: (page: number) => void;
  onEdit: (entry: LedgerEntry) => void;
  onDelete: (entry: LedgerEntry) => void;
  onReset: () => void;
};

function pageNumbers(page: number, count: number) {
  if (count <= 5) return Array.from({ length: count }, (_, i) => i + 1);
  const set = new Set([1, 2, 3, page, count].filter((n) => n >= 1 && n <= count));
  return [...set].sort((a, b) => a - b);
}

export function LedgerTable(props: LedgerTableProps) {
  const { entries, total, turnover, page, pageCount, sort, selectedId, onSort, onPage, onEdit, onDelete, onReset } = props;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const numbers = pageNumbers(page, pageCount);

  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-low/60 p-space-md">
        <div className="flex items-center gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Рӯйхати муомилот</h2>
          <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label-caps text-label-caps font-bold text-on-secondary-container">
            {total} сабт
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body-sm text-body-sm text-on-surface-variant">Мураттабсозӣ:</span>
          <FilterSelect<SortOrder>
            label="Мураттабсозӣ"
            value={sort}
            options={sortOptions}
            onChange={onSort}
            display={sortOptions.find((o) => o.value === sort)?.label ?? ""}
            caret="expand_more"
            bold
            className="bg-transparent px-1 hover:bg-surface-container"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container font-label-caps text-label-caps tracking-wider text-on-surface-variant uppercase">
              <th scope="col" className="px-space-md py-3">Тарз / Сарчашма</th>
              <th scope="col" className="px-space-md py-3">Тавсифи амалиёт</th>
              <th scope="col" className="px-space-md py-3">Категория</th>
              <th scope="col" className="px-space-md py-3">Сана ва вақт</th>
              <th scope="col" className="px-space-md py-3">Муаллиф</th>
              <th scope="col" className="px-space-md py-3 text-right">Маблағ</th>
              <th scope="col" className="px-space-md py-3 text-center">Ҳолат</th>
              <th scope="col" className="px-space-md py-3 text-right">Амалҳо</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md">
            {entries.map((entry) => {
              const source = sources[entry.source];
              const category = categories[entry.category];
              return (
                <tr
                  key={entry.id}
                  onClick={() => onEdit(entry)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-surface-container-low/70",
                    selectedId === entry.id && "bg-primary-fixed/10",
                  )}
                >
                  <td className="px-space-md py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-full shadow-xs", source.iconClassName)}>
                        <Icon name={source.icon} className="text-sm" />
                      </span>
                      <span className="font-body-sm text-body-sm font-medium text-on-surface">{source.label}</span>
                    </div>
                  </td>
                  <td className="min-w-56 px-space-md py-3.5">
                    <div className="font-semibold text-on-surface">{entry.title}</div>
                    <div className="font-body-sm text-body-sm text-outline">{entry.description}</div>
                  </td>
                  <td className="px-space-md py-3.5 whitespace-nowrap">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-body-sm text-body-sm", category.pillClassName)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", category.dotClassName)} />
                      {category.label}
                    </span>
                  </td>
                  <td className="px-space-md py-3.5 font-body-sm text-body-sm whitespace-nowrap text-on-surface-variant">
                    <div>{formatLedgerDate(entry.date)}</div>
                    <div className="text-outline">{entry.time}</div>
                  </td>
                  <td className="px-space-md py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={cn("flex h-6 w-6 items-center justify-center rounded-full font-label-caps text-label-caps font-bold", entry.author.className)}>
                        {entry.author.initials}
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface">{entry.author.name}</span>
                    </div>
                  </td>
                  <td className="px-space-md py-3.5 text-right whitespace-nowrap">
                    <span className={cn("font-tabular-ledger text-tabular-ledger font-bold tnum", entry.amount < 0 ? "text-error" : "text-primary")}>
                      {formatSomoni(entry.amount, { sign: true })}
                    </span>
                  </td>
                  <td className="px-space-md py-3.5 text-center whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 font-label-caps text-label-caps font-bold",
                        entry.status === "confirmed" ? "bg-primary/10 text-primary" : "bg-tertiary-fixed text-on-tertiary-fixed",
                      )}
                    >
                      {entry.status === "confirmed" ? "Тасдиқшуда" : "Интизор"}
                    </span>
                  </td>
                  <td className="px-space-md py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title="Таҳрир"
                        aria-label={`Таҳрири ${entry.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(entry);
                        }}
                        className={cn(
                          "rounded-sm p-1 transition-colors hover:bg-surface-container hover:text-primary",
                          selectedId === entry.id ? "text-primary" : "text-outline-variant",
                        )}
                      >
                        <Icon name="edit" className="text-lg" />
                      </button>
                      <button
                        type="button"
                        title="Нест кардан"
                        aria-label={`Нест кардани ${entry.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(entry);
                        }}
                        className="rounded-sm p-1 text-outline transition-colors hover:bg-surface-container hover:text-error"
                      >
                        <Icon name="delete" className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {total === 0 && (
          <div className="flex flex-col items-center gap-space-sm px-space-md py-space-xl text-center">
            <Icon name="search_off" className="text-4xl text-outline-variant" />
            <p className="font-headline-sm text-headline-sm text-on-surface">Амалиёт ёфт нашуд</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Филтрҳо ё матни ҷустуҷӯро тағйир диҳед.</p>
            <button type="button" onClick={onReset} className="font-body-sm text-body-sm font-semibold text-primary hover:underline">
              Тоза кардани филтрҳо
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-space-sm border-t border-surface-container p-space-md font-body-sm text-body-sm text-on-surface-variant">
        <div className="flex flex-wrap items-center gap-space-sm">
          <span>
            Нишон додани <strong>{from}–{to}</strong> аз <strong>{total}</strong> амалиёт
          </span>
          <span className="hidden h-4 w-px bg-outline-variant sm:inline-block" />
          <span className="text-outline">
            Ҳаҷми умумии гардиш:{" "}
            <strong className="font-tabular-ledger text-tabular-ledger text-on-surface tnum">{formatSomoni(turnover)}</strong>
          </span>
        </div>
        <nav aria-label="Саҳифаҳо" className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Саҳифаи қаблӣ"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="rounded-sm bg-surface-container p-1 text-on-surface hover:bg-surface-container-high disabled:opacity-40"
          >
            <Icon name="chevron_left" className="text-base" />
          </button>
          {numbers.map((n, index) => (
            <span key={n} className="flex items-center gap-1">
              {index > 0 && n - numbers[index - 1] > 1 && <span className="px-1 text-outline">...</span>}
              <button
                type="button"
                aria-current={n === page ? "page" : undefined}
                onClick={() => onPage(n)}
                className={cn(
                  "rounded-sm px-3 py-1",
                  n === page ? "bg-primary font-bold text-on-primary" : "font-medium text-on-surface hover:bg-surface-container",
                )}
              >
                {n}
              </button>
            </span>
          ))}
          <button
            type="button"
            aria-label="Саҳифаи навбатӣ"
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
            className="rounded-sm bg-surface-container p-1 text-on-surface hover:bg-surface-container-high disabled:opacity-40"
          >
            <Icon name="chevron_right" className="text-base" />
          </button>
        </nav>
      </div>
    </div>
  );
}
