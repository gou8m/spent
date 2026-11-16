import Link from "next/link";
import { BackButton } from "@/components/back-button";

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-bg">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-7">
        <p className="text-[1.75rem] font-extrabold tracking-[-1px] text-accent">Spent.</p>
        <section
          className="mt-15 rounded-[28px] px-6 py-9 text-center text-hero-text"
          style={{ background: "var(--hero-gradient)" }}
        >
          <p className="text-[4.5rem] font-extrabold leading-none tracking-[-3px] text-accent">404</p>
          <h1 className="mt-1 text-[1.375rem] font-extrabold tracking-[-0.5px]">This page wandered off</h1>
          <p className="mt-1.5 text-sm font-semibold text-hero-text-secondary">The link may be old or mistyped.</p>
        </section>
        <Link href="/dashboard" className="mt-5.5 flex h-14.5 w-full items-center justify-center gap-2 rounded-[20px] bg-accent text-[1.0625rem] font-bold text-text-on-accent shadow-[0_8px_20px_rgba(27,107,51,0.28)] transition-colors hover:bg-accent-hover">
          Go to Home
        </Link>
        <BackButton className="mt-2.5 flex h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-surface-2 text-[0.9375rem] font-bold text-text-primary transition-colors hover:bg-surface-3">Go back</BackButton>
      </div>
    </main>
  );
}
