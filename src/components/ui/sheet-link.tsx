"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { skipNextSheetRewind } from "@/hooks/use-sheet-back-button";

/**
 * A link inside a sheet. A plain click closes the sheet and navigates by *replacing* the history
 * entry the sheet added (so Back goes to the page the sheet was opened from, not to a stale
 * duplicate of it). Modified clicks (new tab, etc.) behave like any normal link.
 */
export function SheetLink({
  href,
  onNavigate,
  children,
  ...rest
}: Omit<React.ComponentProps<typeof Link>, "href" | "onClick"> & { href: string; onNavigate: () => void }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        skipNextSheetRewind();
        onNavigate();
        router.replace(href);
      }}
    >
      {children}
    </Link>
  );
}
