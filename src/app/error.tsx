"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/constants";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-dvh bg-bg">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-7">
        <p className="text-[1.75rem] font-extrabold tracking-[-1px] text-accent">Spent.</p>
        <div className="mt-15 text-center">
          <span className="mx-auto flex h-21 w-21 items-center justify-center rounded-[28px] bg-error-subtle text-error">
            <TriangleAlert size={40} strokeWidth={2} />
          </span>
          <h1 className="mt-5 text-[1.625rem] font-extrabold tracking-[-0.8px] text-text-primary">Something went wrong</h1>
          <p className="mx-auto mt-2 max-w-75 text-[0.9375rem] leading-snug text-text-secondary">
            Your data is safe. Try again, and if it keeps happening let us know.
          </p>
        </div>
        <button type="button" onClick={reset} className="mt-6.5 flex h-14.5 w-full items-center justify-center gap-2 rounded-[20px] bg-accent text-[1.0625rem] font-bold text-text-on-accent shadow-[0_8px_20px_rgba(27,107,51,0.28)] transition-colors hover:bg-accent-hover">
          Try again
        </button>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-2.5 flex h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-surface-2 text-[0.9375rem] font-bold text-text-primary transition-colors hover:bg-surface-3">
          Contact support
        </a>
      </div>
    </main>
  );
}
