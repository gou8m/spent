import { WifiOff } from "lucide-react";
import { ReloadButton } from "@/components/reload-button";

// Shown by the service worker (public/sw.js) when a page cannot be loaded without a connection.
export const metadata = { title: "Offline · Spent." };

export default function OfflinePage() {
  return (
    <main className="min-h-dvh bg-bg">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-7">
        <p className="text-[1.75rem] font-extrabold tracking-[-1px] text-accent">Spent.</p>
        <div className="mt-15 text-center">
          <span className="mx-auto flex h-21 w-21 items-center justify-center rounded-[28px] bg-accent-subtle text-accent-hover">
            <WifiOff size={40} strokeWidth={2} />
          </span>
          <h1 className="mt-5 text-[1.625rem] font-extrabold tracking-[-0.8px] text-text-primary">You are offline</h1>
          <p className="mx-auto mt-2 max-w-75 text-[0.9375rem] leading-snug text-text-secondary">
            Spent. needs a connection to load your money. Your data is safe. Reconnect and try again.
          </p>
        </div>
        <ReloadButton className="mt-6.5 flex h-14.5 w-full items-center justify-center gap-2 rounded-[20px] bg-accent text-[1.0625rem] font-bold text-text-on-accent shadow-[0_8px_20px_rgba(27,107,51,0.28)] transition-colors hover:bg-accent-hover">
          Try again
        </ReloadButton>
      </div>
    </main>
  );
}
