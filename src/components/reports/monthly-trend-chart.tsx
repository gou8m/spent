"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parse } from "date-fns";
import { formatMoney } from "@/lib/money";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function MonthlyTrendChart({
  data,
  currency,
}: {
  data: { month: string; income: number; expense: number; savings: number }[];
  currency: string;
}) {
  const hasActivity = data.some((d) => d.income > 0 || d.expense > 0);

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-1.5">
        <CardTitle>Month-over-month</CardTitle>
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-income" /> Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-expense" /> Expenses
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-2.5 rounded-full bg-accent" /> Savings
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {!hasActivity ? (
          <div className="flex h-64 items-center justify-center text-sm text-text-muted">No activity in this period</div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--color-divider)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(m) => format(parse(m, "yyyy-MM", new Date()), "MMM")}
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatMoney(v, currency, undefined, { compact: true })}
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-2)" }}
                  formatter={(value) => formatMoney(Number(value), currency)}
                  labelFormatter={(m) => format(parse(String(m), "yyyy-MM", new Date()), "MMMM yyyy")}
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "none",
                    borderRadius: 16,
                    boxShadow: "var(--shadow-lg)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="income" fill="var(--color-income)" radius={[6, 6, 6, 6]} maxBarSize={22} />
                <Bar dataKey="expense" fill="var(--color-expense)" radius={[6, 6, 6, 6]} maxBarSize={22} />
                <Line type="monotone" dataKey="savings" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
