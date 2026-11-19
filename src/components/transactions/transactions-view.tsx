"use client";

import { useState } from "react";
import { BackHeader } from "@/components/layout/back-header";
import { DrilldownHeader } from "@/components/transactions/drilldown-header";
import { TransactionsBrowser } from "@/components/transactions/transactions-browser";
import { PartyTabs } from "@/components/people/party-tabs";
import type { ComponentProps } from "react";

type BrowserProps = Omit<ComponentProps<typeof TransactionsBrowser>, "onFiltersChanged">;

/** The Transactions screen layout. The category drill-down header (from Reports) belongs to the link the
 * person arrived by, so it goes away as soon as they change a filter. */
export function TransactionsView({
  drill,
  ...browser
}: BrowserProps & {
  drill: {
    categoryName: string;
    type: string;
    from: string | null;
    to: string | null;
    total: number;
    count: number;
    currency: string;
  } | null;
}) {
  const [showDrill, setShowDrill] = useState(true);
  return (
    <div className="space-y-4">
      {drill && showDrill ? (
        <DrilldownHeader
          categoryName={drill.categoryName}
          type={drill.type}
          from={drill.from}
          to={drill.to}
          total={drill.total}
          count={drill.count}
          currency={drill.currency}
        />
      ) : (
        <BackHeader href="/dashboard" title="Transactions" desktopRoot />
      )}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="min-w-0 space-y-4">
          <PartyTabs current="timeline" />
          <TransactionsBrowser {...browser} onFiltersChanged={() => setShowDrill(false)} />
        </div>
        {/* Desktop details panel: TransactionSheet portals the selected transaction in here. */}
        <div id="tx-details-panel" className="sticky top-6 hidden self-start empty:hidden lg:block" />
      </div>
    </div>
  );
}
