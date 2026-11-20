"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidingTabs } from "@/components/ui/sliding-tabs";

type View = "timeline" | "people" | "groups";
const HREF: Record<View, string> = { timeline: "/transactions", people: "/people", groups: "/groups" };

/** "Timeline | People | Groups": the ways to look at your transactions. Tapping the other one moves the bubble at once and then opens that view. */
export function PartyTabs({ current }: { current: View }) {
  const router = useRouter();
  const [shown, setShown] = useState<View>(current);
  // Warm the other two views so switching tabs opens them at once.
  useEffect(() => {
    for (const href of Object.values(HREF)) router.prefetch(href);
  }, [router]);
  return (
    <SlidingTabs
      options={[
        { value: "timeline" as View, label: "Timeline" },
        { value: "people" as View, label: "People" },
        { value: "groups" as View, label: "Groups" },
      ]}
      value={shown}
      onChange={(next) => {
        setShown(next);
        router.push(HREF[next]);
      }}
    />
  );
}
