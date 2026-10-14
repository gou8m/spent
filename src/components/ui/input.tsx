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
          "h-13 w-full rounded-md bg-surface-2 px-4.5 text-[0.9375rem] text-text-primary placeholder:text-text-muted",
          "transition-shadow duration-150 outline-none",
          "focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent",
          error && "ring-2 ring-error/40",
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
      className={cn("mb-2 block text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export const FieldError = ({ children }: { children?: React.ReactNode }) => {
  if (!children) return null;
  return <p className="mt-1.5 text-[0.8125rem] text-error">{children}</p>;
};
