import Link from "next/link";

const LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/acceptable-use", label: "Acceptable Use" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/contact", label: "Contact us" },
];

/** Same four destinations as the signup-time LegalNotice, but for an
 * already-signed-up user — no "by signing up you agree to" framing, just a
 * plain, centered reference row. */
export function ProfileLegalLinks() {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 text-center text-xs text-text-muted">
      {LINKS.map((link, i) => (
        <span key={link.href} className="flex items-center gap-x-2">
          {i > 0 && <span aria-hidden="true">·</span>}
          <Link href={link.href} className="underline hover:text-text-secondary">
            {link.label}
          </Link>
        </span>
      ))}
    </p>
  );
}
