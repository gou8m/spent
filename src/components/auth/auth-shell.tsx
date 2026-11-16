import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Page chrome shared by every signed-out screen (login, register, forgot/reset
 * password, verify email). `hero` is the login treatment — wordmark + tagline over
 * two soft decorative circles; otherwise a back button, a 32px accent title and a
 * subtitle, matching reference screens 09, 10, 44, 45 and 46. */
export function AuthShell({
  children,
  hero = false,
  backHref,
  title,
  subtitle,
}: {
  children: ReactNode;
  hero?: boolean;
  backHref?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg">
      {hero && (
        <>
          <div
            aria-hidden="true"
            className="absolute -right-[70px] -top-[90px] h-70 w-70 rounded-full"
            style={{ background: "var(--hero-gradient)" }}
          />
          <div aria-hidden="true" className="absolute -left-[60px] top-30 h-32.5 w-32.5 rounded-full bg-sky" />
        </>
      )}
      <div className={`relative mx-auto w-full max-w-md px-5 pb-10 ${hero ? "pt-21" : "pt-7"}`}>
        {hero ? (
          <div>
            <p className="text-[3.25rem] font-extrabold leading-none tracking-[-2px] text-accent">Spent.</p>
            <p className="mt-1.5 text-base font-medium text-text-secondary">Know where your money goes.</p>
          </div>
        ) : (
          <>
            {backHref && (
              <Link
                href={backHref}
                aria-label="Back to sign in"
                className="flex h-11 w-11 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
              >
                <ChevronLeft size={22} strokeWidth={2} />
              </Link>
            )}
            {title && (
              <h1 className="mt-4.5 text-[2rem] font-extrabold leading-tight tracking-[-1px] text-accent">{title}</h1>
            )}
            {subtitle && <p className="mt-1 text-[0.9375rem] text-text-secondary">{subtitle}</p>}
          </>
        )}
        {children}
      </div>
    </main>
  );
}

/** A flat result screen (check your email, verified, failed…): a sage/sky/red icon
 * tile, a title, a message and actions — no card, per the reference. */
export function AuthStatus({
  icon,
  tone = "accent",
  title,
  children,
  actions,
}: {
  icon: ReactNode;
  tone?: "accent" | "error";
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <AuthShell>
      <div className="mt-16 flex flex-col items-center text-center">
        <span
          className={`flex h-24 w-24 items-center justify-center rounded-[28px] ${
            tone === "error" ? "bg-error-subtle text-error" : "bg-accent-subtle text-accent-hover"
          }`}
        >
          {icon}
        </span>
        <h1 className="mt-6 text-[1.625rem] font-extrabold tracking-[-0.8px] text-text-primary">{title}</h1>
        {children && <div className="mt-2 text-[0.9375rem] leading-relaxed text-text-secondary">{children}</div>}
      </div>
      {actions && <div className="mt-8 space-y-2.5">{actions}</div>}
    </AuthShell>
  );
}
