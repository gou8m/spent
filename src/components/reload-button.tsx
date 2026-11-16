"use client";

export function ReloadButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.location.reload()} className={className}>
      {children}
    </button>
  );
}
