import Link from "next/link";

const link = "font-bold text-accent hover:underline";

export function LegalNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-xs leading-normal text-text-secondary ${className}`}>
      By continuing you agree to our{" "}
      <Link href="/terms" className={link}>
        Terms
      </Link>
      ,{" "}
      <Link href="/acceptable-use" className={link}>
        Acceptable Use
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className={link}>
        Privacy Policy
      </Link>
      . Questions?{" "}
      <Link href="/contact" className={link}>
        Contact us
      </Link>
      .
    </p>
  );
}
