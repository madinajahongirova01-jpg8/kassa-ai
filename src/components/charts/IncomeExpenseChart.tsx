"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyFlow } from "@/data/types";
import { formatSomoni } from "@/lib/format";

type IncomeExpenseChartProps = {
  data: DailyFlow[];
  compact?: boolean;
};

const colors = {
  income: "#07644e",
  expense: "rgba(186, 26, 26, 0.7)",
  expenseToday: "rgba(186, 26, 26, 0.8)",
  expenseCompact: "#afcdc2",
  grid: "#e2e3de",
  axis: "#6f7974",
};

type TickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
  data: DailyFlow[];
};

function TodayTick({ x, y, payload, data }: TickProps) {
  const item = data.find((d) => d.day === payload?.value);
  return (
    <text
      x={Number(x ?? 0)}
      y={Number(y ?? 0) + 10}
      textAnchor="middle"
      fontSize={11}
      fontWeight={item?.today ? 700 : 600}
      fill={item?.today ? colors.income : colors.axis}
    >
      {payload?.value}
    </text>
  );
}

export function IncomeExpenseChart({ data, compact = false }: IncomeExpenseChartProps) {
  if (compact) {
    return (
      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={(props) => <TodayTick {...props} data={data} />}
            />
            <Bar dataKey="income" fill={colors.income} barSize={10} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            <Bar
              dataKey="expense"
              fill={colors.expenseCompact}
              barSize={10}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={64}
            ticks={[0, 1000, 2000, 3000]}
            domain={[0, 3000]}
            tick={{ fontSize: 11, fill: colors.axis, fontWeight: 600 }}
            tickFormatter={(value: number) => formatSomoni(value)}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={(props) => <TodayTick {...props} data={data} />}
          />
          <Tooltip
            cursor={{ fill: "rgba(164, 242, 214, 0.2)" }}
            formatter={(value, name) => [formatSomoni(Number(value)), name === "income" ? "Даромад" : "Хароҷот"]}
            labelFormatter={(label) => `${label} Май`}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e3de", fontSize: 12 }}
          />
          <Bar dataKey="income" fill={colors.income} barSize={10} radius={[2, 2, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="expense" barSize={10} radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.day} fill={d.today ? colors.expenseToday : colors.expense} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
