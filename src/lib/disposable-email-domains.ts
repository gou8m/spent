/**
 * A curated set of well-known disposable/temporary email domains. Not
 * exhaustive (new ones appear constantly) — combined with required email
 * verification, this is a first line of defense against throwaway signups,
 * not a complete solution.
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "guerrillamail.info",
  "10minutemail.com",
  "10minutemail.net",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "fakeinbox.com",
  "sharklasers.com",
  "dispostable.com",
  "maildrop.cc",
  "mailnesia.com",
  "mintemail.com",
  "mytemp.email",
  "tempinbox.com",
  "moakt.com",
  "emailondeck.com",
  "spamgourmet.com",
  "burnermail.io",
  "discard.email",
  "inboxkitten.com",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return !!domain && DISPOSABLE_EMAIL_DOMAINS.has(domain);
}
