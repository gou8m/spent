/** 4-segment meter + label under the password field on sign-up (reference 10).
 * Scores one point each for length, mixed case, a number and a symbol — the
 * same character classes registerSchema requires, so "Strong" means it will pass. */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[a-z]/.test(password) && /[A-Z]/.test(password) ? 1 : 0) +
    (/\d/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const label = ["Too weak", "Weak", "Fair", "Good", "Strong password"][score];

  return (
    <div aria-live="polite">
      <div className="mt-2.5 flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-sm ${i <= score ? "bg-bar-fill" : "bg-divider"}`} />
        ))}
      </div>
      <p className={`mt-1.5 text-xs font-semibold ${score === 4 ? "text-accent-hover" : "text-text-secondary"}`}>{label}</p>
    </div>
  );
}
