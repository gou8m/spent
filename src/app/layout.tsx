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
  description: "A calm place for your money. Track spending, budgets and goals.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4FAF2" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1712" },
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
            position="bottom-center"
            offset={{ bottom: 24 }}
            mobileOffset={{ bottom: 104, left: 20, right: 20 }}
            toastOptions={{
              unstyled: false,
              style: {
                background: "var(--text-primary)",
                color: "var(--bg)",
                border: "0",
                borderRadius: "18px",
                minHeight: "56px",
                padding: "0 8px 0 18px",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "var(--font-display)",
              },
              classNames: {
                actionButton: "!h-11 !rounded-[14px] !bg-transparent !px-4 !text-sm !font-extrabold !text-[color:var(--toast-action)]",
                cancelButton: "!h-11 !rounded-[14px] !bg-transparent !px-4 !text-sm !font-bold",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
