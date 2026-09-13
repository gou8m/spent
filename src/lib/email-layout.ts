/**
 * Shared visual shell for every transactional email — mirrors the app's
 * "Nocturne" light-mode palette (hardcoded hex, not CSS variables: most
 * email clients strip <style> blocks and custom properties entirely, so
 * every color has to be inlined). Dark-mode email support is inconsistent
 * enough across clients (Gmail, Outlook, Apple Mail all disagree) that a
 * single well-contrasted light theme is the safer choice for transactional
 * mail, matching common practice.
 */

const COLORS = {
  bg: "#f4f4f7",
  surface: "#ffffff",
  divider: "#ececf2",
  textPrimary: "#100f16",
  textSecondary: "#6e6e7d",
  textMuted: "#9c9caa",
  accent: "#5b3bff",
};

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
<div style="background:${COLORS.bg};padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;width:44px;height:44px;border-radius:14px;background:${COLORS.accent};color:#ffffff;font-size:19px;font-weight:700;line-height:44px;text-align:center;">S</span>
    </div>
    <div style="background:${COLORS.surface};border-radius:24px;padding:32px;border:1px solid ${COLORS.divider};">
      <h1 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${COLORS.textPrimary};">${heading}</h1>
      <div style="font-size:15px;line-height:1.65;color:${COLORS.textSecondary};">${bodyHtml}</div>
      ${
        ctaUrl && ctaLabel
          ? `<div style="margin:28px 0 4px;text-align:center;">
        <a href="${ctaUrl}" style="display:inline-block;background:${COLORS.accent};color:#ffffff;padding:13px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px;">${ctaLabel}</a>
      </div>`
          : ""
      }
      ${footerNote ? `<p style="margin:24px 0 0;font-size:13px;color:${COLORS.textMuted};line-height:1.5;">${footerNote}</p>` : ""}
    </div>
    <p style="text-align:center;margin:24px 0 0;font-size:12px;color:${COLORS.textMuted};">Spent · Personal finance, kept simple</p>
  </div>
</div>`;
}
