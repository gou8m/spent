import { Resend } from "resend";
import { renderEmailLayout } from "@/lib/email-layout";

/**
 * RESEND_API_KEY must be set for real delivery. Each transactional email uses
 * a purpose-specific sender address once you've verified a domain — set
 * EMAIL_FROM_WELCOME / EMAIL_FROM_NOREPLY (and optionally EMAIL_REPLY_TO) in
 * .env; all fall back to EMAIL_FROM, and that falls back to Resend's shared
 * testing sender (onboarding@resend.dev), which works without a verified
 * domain but can only deliver to your own Resend account email.
 */
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SANDBOX_FROM = "Spent <onboarding@resend.dev>";
const FROM_WELCOME = process.env.EMAIL_FROM_WELCOME ?? process.env.EMAIL_FROM ?? SANDBOX_FROM;
const FROM_NOREPLY = process.env.EMAIL_FROM_NOREPLY ?? process.env.EMAIL_FROM ?? SANDBOX_FROM;
const REPLY_TO = process.env.EMAIL_REPLY_TO || undefined;

async function send(params: { from: string; to: string; subject: string; html: string }, fallbackLinkDescription: string, url: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — ${fallbackLinkDescription} for ${params.to}: ${url}`);
    return;
  }

  const { error } = await resend.emails.send({ ...params, replyTo: REPLY_TO });
  if (error) {
    // Same fallback as the "no API key" branch above — keeps local testing usable even when
    // Resend rejects the send (e.g. sandbox mode, or an unverified domain — see TODO.md).
    console.warn(`[email] send failed (${error.message}) — ${fallbackLinkDescription} for ${params.to}: ${url}`);
    throw new Error(`Resend rejected the ${fallbackLinkDescription}: ${error.message}`);
  }
}

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  const html = renderEmailLayout({
    heading: `Hi ${name.split(" ")[0]}, welcome to Spent`,
    bodyHtml: `<p style="margin:0;">Confirm your email address to finish setting up your account.</p>`,
    ctaLabel: "Verify email",
    ctaUrl: verifyUrl,
    footerNote: "This link expires in 24 hours. If you didn't create a Spent account, you can ignore this email.",
  });

  await send({ from: FROM_WELCOME, to, subject: "Verify your email for Spent", html }, "verification link", verifyUrl);
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const html = renderEmailLayout({
    heading: `Hi ${name.split(" ")[0]},`,
    bodyHtml: `<p style="margin:0;">We got a request to reset your Spent password. If this was you, choose a new one below.</p>`,
    ctaLabel: "Reset password",
    ctaUrl: resetUrl,
    footerNote: "This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.",
  });

  await send({ from: FROM_NOREPLY, to, subject: "Reset your Spent password", html }, "password reset link", resetUrl);
}

export async function sendEmailChangeVerification(to: string, name: string, verifyUrl: string) {
  const html = renderEmailLayout({
    heading: `Hi ${name.split(" ")[0]},`,
    bodyHtml: `<p style="margin:0;">Confirm this address to make it your new sign-in email for Spent.</p>`,
    ctaLabel: "Confirm new email",
    ctaUrl: verifyUrl,
    footerNote: "This link expires in 24 hours. If you didn't request this change, you can ignore this email — your account email won't change.",
  });

  await send({ from: FROM_NOREPLY, to, subject: "Confirm your new email for Spent", html }, "email change link", verifyUrl);
}
