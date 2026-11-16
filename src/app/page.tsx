import Link from "next/link";
import { redirect } from "next/navigation";
import { Target, PieChart } from "lucide-react";
import { auth } from "@/auth";

export default async function RootPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-dvh bg-bg">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-7 md:max-w-xl">
        <header className="flex items-center justify-between">
          <p className="text-[1.875rem] font-extrabold tracking-[-1px] text-accent">Spent.</p>
          <Link
            href="/login"
            className="flex h-11 items-center rounded-full bg-accent-subtle px-4.5 text-sm font-bold text-accent-hover transition-colors hover:bg-surface-3"
          >
            Sign in
          </Link>
        </header>

        <h1 className="mt-7.5 text-[2.625rem] font-extrabold leading-[1.05] tracking-[-1.6px] text-text-primary">
          Know where your money goes.
        </h1>
        <p className="mt-3 text-base leading-snug text-text-secondary">
          Spent tracks accounts, budgets, goals and bills in one calm place. Private by default.
        </p>

        <Link href="/register" className="mt-5.5 flex h-14.5 w-full items-center justify-center gap-2 rounded-[20px] bg-accent text-[1.0625rem] font-bold text-text-on-accent shadow-[0_8px_20px_rgba(27,107,51,0.28)] transition-colors hover:bg-accent-hover">
          Get started free
        </Link>
        <Link href="/login" className="mt-2.5 flex h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-surface-2 text-[0.9375rem] font-bold text-text-primary transition-colors hover:bg-surface-3">
          I already have an account
        </Link>

        <section className="mt-6 rounded-[28px] px-5.5 py-4.5 text-hero-text" style={{ background: "var(--hero-gradient)" }}>
          <p className="text-sm font-semibold">Total Balance</p>
          <p className="mt-1 text-[2.5rem] font-extrabold tracking-[-1.5px]">$4,250.00</p>
          <div className="mt-2.5 flex gap-2">
            <span className="rounded-full bg-white/50 px-2.5 py-1.25 text-xs font-bold">+$3,200 income</span>
            <span className="rounded-full bg-white/50 px-2.5 py-1.25 text-xs font-bold">-$148.70 spent</span>
          </div>
        </section>

        <div className="mt-3 flex gap-2.5">
          <div className="flex-1 rounded-[22px] bg-sky p-3.5 text-sky-text">
            <Target size={24} strokeWidth={2} />
            <p className="mt-2 text-sm font-bold">Goals that track themselves</p>
          </div>
          <div className="flex-1 rounded-[22px] bg-surface-2 p-3.5 text-text-primary">
            <PieChart size={24} strokeWidth={2} />
            <p className="mt-2 text-sm font-bold">Budgets with real numbers</p>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-text-secondary">
          <Link href="/terms" className="hover:underline">Terms</Link> · <Link href="/privacy" className="hover:underline">Privacy</Link> ·{" "}
          <Link href="/contact" className="hover:underline">Contact</Link>
        </p>
      </div>
    </main>
  );
}
