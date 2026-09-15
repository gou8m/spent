"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parse } from "date-fns";
import { formatMoney } from "@/lib/money";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// A fixed categorical order, deliberately distinct from the semantic income/expense/
// savings/warning hues used elsewhere on this same page — see globals.css.
const LINE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

export function AccountBalancesChart({
  data,
  accounts,
  currency,
}: {
  data: Record<string, string | number | null>[];
  accounts: { id: string; name: string }[];
  currency: string;
}) {
  const hasActivity = accounts.length > 0 && data.some((row) => accounts.some((a) => typeof row[a.id] === "number"));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account balances</CardTitle>
        {accounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
            {accounts.map((account, i) => (
              <span key={account.id} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: LINE_COLORS[i % LINE_COLORS.length] }} />
                {account.name}
              </span>
            ))}
          </div>
        )}
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
                  formatter={(value, name) => [
                    formatMoney(Number(value), currency),
                    accounts.find((a) => a.id === name)?.name ?? String(name),
                  ]}
                  labelFormatter={(m) => format(parse(String(m), "yyyy-MM", new Date()), "MMMM yyyy")}
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "none",
                    borderRadius: 16,
                    boxShadow: "var(--shadow-lg)",
                    fontSize: 12,
                  }}
                />
                {accounts.map((account, i) => (
                  <Line
                    key={account.id}
                    type="monotone"
                    dataKey={account.id}
                    name={account.id}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: LINE_COLORS[i % LINE_COLORS.length], strokeWidth: 2, stroke: "var(--color-surface)" }}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-surface)" }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
