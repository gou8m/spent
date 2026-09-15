"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parse } from "date-fns";
import { formatMoney } from "@/lib/money";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function NetWorthTrendChart({ data, currency }: { data: { month: string; netWorth: number | null }[]; currency: string }) {
  const hasActivity = data.some((d) => d.netWorth !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net worth trend</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!hasActivity ? (
          <div className="flex h-56 items-center justify-center text-sm text-text-muted">Not enough data yet</div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-divider)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(m) => format(parse(m, "yyyy-MM", new Date()), "MMM yyyy")}
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
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
                  formatter={(value) => [formatMoney(Number(value), currency), "Net worth"]}
                  labelFormatter={(m) => format(parse(String(m), "yyyy-MM", new Date()), "MMMM yyyy")}
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "none",
                    borderRadius: 16,
                    boxShadow: "var(--shadow-lg)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="var(--color-savings)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-savings)", strokeWidth: 2, stroke: "var(--color-surface)" }}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-surface)" }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
