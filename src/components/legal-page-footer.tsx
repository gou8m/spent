import Link from "next/link";

const LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/acceptable-use", label: "Acceptable Use" },
  { href: "/contact", label: "Contact us" },
];

/** Cross-navigation between the legal pages themselves, so a reader doesn't
 * have to go back to login/register to reach the other ones. */
export function LegalPageFooter({ current }: { current: string }) {
  return (
    <div className="mt-10 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-divider pt-6 text-sm">
      {LINKS.filter((l) => l.href !== current).map((l) => (
        <Link key={l.href} href={l.href} className="text-accent-text hover:underline">
          {l.label}
        </Link>
      ))}
    </div>
  );
}
