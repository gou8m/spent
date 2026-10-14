import type * as React from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { InlineScript } from "@/components/inline-script";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const SET_THEME_BEFORE_PAINT = `(function(){try{var t=localStorage.getItem("theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`;

// One typeface everywhere, including money amounts — see globals.css 1b.
const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spent — Personal Finance",
  description: "A calm, premium way to track spending, budgets and goals.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable} suppressHydrationWarning>
      <head>
        <InlineScript html={SET_THEME_BEFORE_PAINT} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "var(--surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-display)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
