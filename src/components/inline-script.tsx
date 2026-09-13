/**
 * Next.js 16 warns whenever a rendered <script> tag reaches the client render
 * path. This split — text/javascript on the server, text/plain (inert) on the
 * client — plus suppressHydrationWarning is the documented way to keep an
 * inline, pre-hydration script without tripping that warning.
 * See node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
