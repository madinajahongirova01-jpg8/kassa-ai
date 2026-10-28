import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  render: (row: T) => ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  className?: string;
};

const alignClass = { left: "text-left", right: "text-right", center: "text-center" };

export function Table<T>({ columns, rows, getRowKey, className }: TableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-surface-container font-label-caps text-label-caps tracking-wider text-outline uppercase">
            {columns.map((column) => (
              <th key={column.key} className={cn("pb-space-sm font-semibold", alignClass[column.align ?? "left"])}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="transition-colors hover:bg-surface-container-low">
              {columns.map((column) => (
                <td key={column.key} className={cn("py-space-sm", alignClass[column.align ?? "left"], column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
