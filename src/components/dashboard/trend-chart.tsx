"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";
import { formatMoney } from "@/lib/money";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function TrendChart({
  data,
  currency,
}: {
  data: { date: string; income: number; expense: number }[];
  currency: string;
}) {
  const hasActivity = data.some((d) => d.income > 0 || d.expense > 0);
  // Diverging bars share one zero baseline — expense is negated so it draws
  // downward from the same origin income draws upward from, instead of
  // sitting side by side as its own bar.
  const chartData = data.map((d) => ({ ...d, expenseNeg: -d.expense }));

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
            No activity in the last 30 days
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} stackOffset="sign">
                <CartesianGrid vertical={false} stroke="var(--color-divider)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => format(parseISO(d), "MMM d")}
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={32}
                />
                <YAxis
                  tickFormatter={(v) => formatMoney(v, currency, "en-US", { compact: true })}
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <ReferenceLine y={0} stroke="var(--color-border-strong)" strokeWidth={1} />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-2)" }}
                  formatter={(value, name) => [formatMoney(Math.abs(Number(value)), currency), name]}
                  labelFormatter={(d) => format(parseISO(String(d)), "MMM d, yyyy")}
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "none",
                    borderRadius: 16,
                    boxShadow: "var(--shadow-lg)",
                    fontSize: 12,
                  }}
                />
                {/* Recharts applies a negative-value bar's radius array to the same raw top/bottom
                    slots as a positive one rather than flipping it for the bar's now-inverted
                    direction — so the expense bar needs the *same* radius as income, not a
                    naively mirrored one, to round its far end and stay square at the baseline. */}
                <Bar dataKey="income" name="Income" stackId="flow" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="expenseNeg" name="Expenses" stackId="flow" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
