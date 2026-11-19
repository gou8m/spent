"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidingTabs } from "@/components/ui/sliding-tabs";

type View = "timeline" | "people";

/** "Timeline | People": the two ways to look at your transactions. Tapping the other one moves the bubble at once and then opens that view. */
export function PartyTabs({ current }: { current: View }) {
  const router = useRouter();
  const [shown, setShown] = useState<View>(current);
  return (
    <SlidingTabs
      options={[
        { value: "timeline" as View, label: "Timeline" },
        { value: "people" as View, label: "People" },
      ]}
      value={shown}
      onChange={(next) => {
        setShown(next);
        router.push(next === "people" ? "/people" : "/transactions");
      }}
    />
  );
}
