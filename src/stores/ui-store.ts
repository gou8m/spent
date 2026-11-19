import { create } from "zustand";

interface TransactionSheetState {
  isOpen: boolean;
  editingTransactionId: string | null;
  defaultType: "EXPENSE" | "INCOME" | "TRANSFER";
  /** Opens the form as a repayment of this loan (set from the Loans page). */
  repayLoanId: string | null;
  /** Opens the add form dated this day ("yyyy-MM-dd"), from the Calendar. */
  defaultDate: string | null;
  open: (opts?: { transactionId?: string; type?: "EXPENSE" | "INCOME" | "TRANSFER"; repayLoanId?: string; date?: string }) => void;
  close: () => void;
}

export const useTransactionSheet = create<TransactionSheetState>((set) => ({
  isOpen: false,
  editingTransactionId: null,
  defaultType: "EXPENSE",
  repayLoanId: null,
  defaultDate: null,
  open: (opts) =>
    set({
      isOpen: true,
      editingTransactionId: opts?.transactionId ?? null,
      defaultType: opts?.type ?? "EXPENSE",
      repayLoanId: opts?.repayLoanId ?? null,
      defaultDate: opts?.date ?? null,
    }),
  close: () => set({ isOpen: false, editingTransactionId: null, repayLoanId: null, defaultDate: null }),
}));
