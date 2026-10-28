"use client";

import { Cell, Pie, PieChart } from "recharts";
import type { ExpenseShare } from "@/data/types";

type DonutChartProps = {
  data: ExpenseShare[];
  centerValue: string;
  centerLabel: string;
  size?: number;
};

export function DonutChart({ data, centerValue, centerLabel, size = 128 }: DonutChartProps) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={[{ value: 100 }]}
          dataKey="value"
          innerRadius={size * 0.39}
          outerRadius={size * 0.47}
          fill="#eeeee9"
          stroke="none"
          isAnimationActive={false}
        />
        <Pie
          data={data}
          dataKey="percent"
          nameKey="label"
          startAngle={90}
          endAngle={-270}
          innerRadius={size * 0.385}
          outerRadius={size * 0.5}
          stroke="none"
          isAnimationActive={false}
        >
          {data.map((item) => (
            <Cell key={item.label} fill={item.color} />
          ))}
        </Pie>
      </PieChart>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{centerValue}</span>
        <span className="font-label-caps text-label-caps text-outline">{centerLabel}</span>
      </div>
    </div>
  );
}
