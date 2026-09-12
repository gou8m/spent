import Link from "next/link";
import { ChevronRight, Tags, LogOut, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { signOutAction } from "@/actions/session";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { CURRENCIES } from "@/lib/constants";

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
  const currencyLabel = CURRENCIES.find((c) => c.code === user.currency)?.name ?? user.currency;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Settings</h1>

      <Card className="p-5">
        <p className="text-sm font-semibold text-text-primary">{user.name}</p>
        <p className="text-sm text-text-secondary">{user.email}</p>
      </Card>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Finance</h2>
        <Card className="divide-y divide-divider p-0">
          <Link href="/settings/categories" className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
            <Tags size={17} className="text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text-primary">Categories</span>
            <ChevronRight size={16} className="text-text-muted" />
          </Link>
          <Link href="/accounts" className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
            <Wallet size={17} className="text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text-primary">Accounts</span>
            <ChevronRight size={16} className="text-text-muted" />
          </Link>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex-1 text-sm font-medium text-text-primary">Primary currency</span>
            <span className="text-sm text-text-muted">{currencyLabel}</span>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Appearance</h2>
        <Card className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm font-medium text-text-primary">Theme</span>
          <ThemeToggle />
        </Card>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">Account</h2>
        <Card className="p-0">
          <form action={signOutAction}>
            <button type="submit" className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2">
              <LogOut size={17} className="text-error" />
              <span className="text-sm font-medium text-error">Sign out</span>
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
