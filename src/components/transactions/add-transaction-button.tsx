"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactionSheet } from "@/stores/ui-store";

export function AddTransactionButton({ className }: { className?: string }) {
  const open = useTransactionSheet((s) => s.open);
  return (
    <Button size="sm" className={className} onClick={() => open()}>
      <Plus size={16} strokeWidth={2.5} />
      Add transaction
    </Button>
  );
}
