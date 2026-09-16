import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-text-on-accent hover:bg-accent-hover shadow-sm",
  secondary:
    "bg-surface-2 text-text-primary hover:bg-surface-3 shadow-xs",
  outline:
    "bg-surface text-text-primary border border-border-strong hover:bg-surface-2 shadow-xs",
  ghost: "bg-transparent text-text-primary hover:bg-surface-2",
  destructive: "bg-error text-white hover:opacity-90 shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-full",
  md: "h-11 px-5 text-sm gap-2 rounded-full",
  lg: "h-13 px-7 text-base gap-2 rounded-full",
  icon: "h-11 w-11 rounded-full shrink-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and disables the button — the one shared "this is working on it"
   * affordance for every create/update/delete action in the app, so a slow server
   * response never just looks like an unresponsive click. */
  loading?: boolean;
  /** Replaces `children` while `loading` is true (e.g. "Saving…"). Falls back to
   * `children` unchanged if omitted, so the spinner alone still communicates state. */
  loadingText?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", loading = false, loadingText, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-150",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 size={size === "sm" ? 14 : 16} strokeWidth={2.5} className="animate-spin" />}
        {loading ? (loadingText ?? children) : children}
      </button>
    );
  },
);
Button.displayName = "Button";
