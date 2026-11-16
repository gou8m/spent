import { create } from "zustand";

interface TransactionSheetState {
  isOpen: boolean;
  editingTransactionId: string | null;
  defaultType: "EXPENSE" | "INCOME" | "TRANSFER";
  open: (opts?: { transactionId?: string; type?: "EXPENSE" | "INCOME" | "TRANSFER" }) => void;
  close: () => void;
}

export const useTransactionSheet = create<TransactionSheetState>((set) => ({
  isOpen: false,
  editingTransactionId: null,
  defaultType: "EXPENSE",
  open: (opts) =>
    set({
      isOpen: true,
      editingTransactionId: opts?.transactionId ?? null,
      defaultType: opts?.type ?? "EXPENSE",
    }),
  close: () => set({ isOpen: false, editingTransactionId: null }),
}));
