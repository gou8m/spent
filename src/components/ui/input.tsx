import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-md border bg-surface px-3.5 text-[0.9375rem] text-text-primary placeholder:text-text-muted",
          "transition-colors duration-150 outline-none",
          "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-subtle",
          error ? "border-error" : "border-border",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("block text-[0.8125rem] font-medium text-text-secondary mb-1.5", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export const FieldError = ({ children }: { children?: React.ReactNode }) => {
  if (!children) return null;
  return <p className="mt-1.5 text-[0.8125rem] text-error">{children}</p>;
};
