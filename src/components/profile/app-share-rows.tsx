"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

const SHARE = {
  title: "Spent.",
  text: "I track my money with Spent, a calm and simple app. Try it:",
  url: "https://spentonline.in",
};

/** "Share app": opens the phone's own share sheet; where there is none (most desktops) it copies the link. */
export function ShareAppRow() {
  async function share() {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(SHARE);
        return;
      }
      await navigator.clipboard.writeText(`${SHARE.text} ${SHARE.url}`);
      toast.success("Link copied");
    } catch (error) {
      // Closing the share sheet is not an error; anything else (blocked clipboard) gets a plain message.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Could not share. Copy spentonline.in instead.");
    }
  }

  return (
    <button type="button" onClick={share} className="flex h-13 w-full items-center gap-3.5 px-4 text-left hover:bg-surface-3">
      <Share2 size={22} strokeWidth={2} className="shrink-0 text-accent-text" />
      <span className="flex-1 text-base font-semibold text-text-primary">Share app</span>
    </button>
  );
}
