"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parse } from "date-fns";
import { formatMoney } from "@/lib/money";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function TrendChart({
  data,
  currency,
}: {
  data: { month: string; income: number; expense: number }[];
  currency: string;
}) {
  const hasActivity = data.some((d) => d.income > 0 || d.expense > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash flow</CardTitle>
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-income" /> Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-expense" /> Expenses
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {!hasActivity ? (
          <div className="flex h-56 items-center justify-center text-sm text-text-muted">
            No activity in the last 3 months
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={6}>
                <CartesianGrid vertical={false} stroke="var(--color-divider)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(m) => format(parse(m, "yyyy-MM", new Date()), "MMM")}
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatMoney(v, currency, "en-US", { compact: true })}
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-2)" }}
                  formatter={(value, name) => [formatMoney(Number(value), currency), name]}
                  labelFormatter={(m) => format(parse(String(m), "yyyy-MM", new Date()), "MMMM yyyy")}
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "none",
                    borderRadius: 16,
                    boxShadow: "var(--shadow-lg)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="income" name="Income" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" name="Expenses" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
