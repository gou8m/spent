"use client";

import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function VerifiedBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0 text-accent" aria-label="Verified">
          <BadgeCheck size={14} strokeWidth={2.25} />
        </span>
      </TooltipTrigger>
      <TooltipContent>Verified — active most days for 6+ months</TooltipContent>
    </Tooltip>
  );
}
