/**
 * Shared visual shell for every transactional email, mirroring the app's Mint
 * light-mode design (reference screen 62): the "Spent." wordmark, a mint hero card
 * holding the heading, message and button, a copy-the-link fallback, and a quiet
 * footer. Colours are hardcoded hex, not CSS variables: most email clients strip
 * <style> blocks and custom properties, so every value has to be inlined. Dark-mode
 * email support is inconsistent across clients, so a single light theme is used.
 */

const COLORS = {
  bg: "#F4FAF2",
  surface2: "#E8EEE9",
  divider: "#E1EAE2",
  textPrimary: "#14231A",
  textSecondary: "#4A5D50",
  heroText: "#14502A",
  accent: "#1B6B33",
  heroFrom: "#A8F5A8",
  heroTo: "#8DEB9A",
};

const FONT = "'Plus Jakarta Sans',-apple-system,'Segoe UI',Arial,sans-serif";

/** Escapes text before it is placed inside an email's HTML (a sign-up name is chosen by whoever registers). */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function renderEmailLayout({
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footerNote,
}: {
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  return `
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<div style="background:${COLORS.bg};padding:40px 16px;font-family:${FONT};color:${COLORS.textPrimary};">
  <div style="max-width:528px;margin:0 auto;">
    <div style="font-size:30px;font-weight:800;letter-spacing:-1px;color:${COLORS.accent};">Spent.</div>
    <div style="margin-top:26px;border-radius:28px;padding:32px 30px;background-color:${COLORS.heroFrom};background-image:linear-gradient(135deg,${COLORS.heroFrom},${COLORS.heroTo});">
      <h1 style="margin:0;font-size:30px;font-weight:800;letter-spacing:-1px;line-height:1.1;color:${COLORS.textPrimary};">${heading}</h1>
      <div style="margin-top:10px;font-size:16px;line-height:1.5;font-weight:600;color:${COLORS.heroText};">${bodyHtml}</div>
      ${
        ctaUrl && ctaLabel
          ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:24px;height:56px;line-height:56px;padding:0 30px;border-radius:18px;background:${COLORS.accent};color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">${ctaLabel}</a>`
          : ""
      }
    </div>
    ${
      ctaUrl
        ? `<div style="margin-top:22px;font-size:13px;line-height:1.45;color:${COLORS.textSecondary};">If the button does not work, copy this link into your browser:</div>
    <div style="margin-top:6px;padding:12px 14px;border-radius:14px;background:${COLORS.surface2};font-size:12px;color:${COLORS.textSecondary};word-break:break-all;">${ctaUrl}</div>`
        : ""
    }
    ${footerNote ? `<div style="margin-top:18px;font-size:13px;line-height:1.45;color:${COLORS.textSecondary};">${footerNote}</div>` : ""}
    <div style="margin-top:30px;padding-top:16px;border-top:1px solid ${COLORS.divider};font-size:12px;color:${COLORS.textSecondary};">Spent. · A calm place for your money</div>
  </div>
</div>`;
}
