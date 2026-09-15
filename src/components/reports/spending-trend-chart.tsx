"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { formatMoney } from "@/lib/money";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function SpendingTrendChart({ data, currency }: { data: { date: string; amount: number }[]; currency: string }) {
  const hasActivity = data.some((d) => d.amount > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending trend</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!hasActivity ? (
          <div className="flex h-56 items-center justify-center text-sm text-text-muted">No spending in this period</div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendingTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-expense)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--color-expense)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-divider)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => format(parseISO(d), "MMM d")}
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tickFormatter={(v) => formatMoney(v, currency, "en-US", { compact: true })}
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
                  formatter={(value) => [formatMoney(Number(value), currency), "Spending"]}
                  labelFormatter={(d) => format(parseISO(String(d)), "MMM d, yyyy")}
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "none",
                    borderRadius: 16,
                    boxShadow: "var(--shadow-lg)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-expense)"
                  strokeWidth={2}
                  fill="url(#spendingTrendFill)"
                  activeDot={{ r: 4, stroke: "var(--color-surface)", strokeWidth: 2 }}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
