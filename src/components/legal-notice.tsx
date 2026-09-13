import Link from "next/link";

export function LegalNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-xs text-text-muted ${className}`}>
      By signing up, you agree to our{" "}
      <Link href="/terms" className="underline hover:text-text-secondary">
        Terms
      </Link>
      ,{" "}
      <Link href="/acceptable-use" className="underline hover:text-text-secondary">
        Acceptable Use
      </Link>
      , and{" "}
      <Link href="/privacy" className="underline hover:text-text-secondary">
        Privacy Policy
      </Link>
      . Questions?{" "}
      <Link href="/contact" className="underline hover:text-text-secondary">
        Contact us
      </Link>
      .
    </p>
  );
}
