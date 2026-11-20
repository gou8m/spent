import { create } from "zustand";

interface TransactionSheetState {
  isOpen: boolean;
  editingTransactionId: string | null;
  defaultType: "EXPENSE" | "INCOME" | "TRANSFER";
  /** Opens the form as a repayment of this loan (set from the Loans page). */
  repayLoanId: string | null;
  /** Opens the add form dated this day ("yyyy-MM-dd"), from the Calendar. */
  defaultDate: string | null;
  /** Opens the add form for this person or shop (from their chat): the name is filled in, and for a person the
   * form asks the right question (lending or gift, repayment, borrowing). */
  party: { name: string; person: boolean } | null;
  open: (opts?: { transactionId?: string; type?: "EXPENSE" | "INCOME" | "TRANSFER"; repayLoanId?: string; date?: string; party?: { name: string; person: boolean } }) => void;
  close: () => void;
}

interface SplitSheetState {
  transactionId: string | null;
  /** Opens "split with a group" for a saved expense. */
  open: (transactionId: string) => void;
  close: () => void;
}

export const useSplitSheet = create<SplitSheetState>((set) => ({
  transactionId: null,
  open: (transactionId) => set({ transactionId }),
  close: () => set({ transactionId: null }),
}));

export const useTransactionSheet = create<TransactionSheetState>((set) => ({
  isOpen: false,
  editingTransactionId: null,
  defaultType: "EXPENSE",
  repayLoanId: null,
  defaultDate: null,
  party: null,
  open: (opts) =>
    set({
      isOpen: true,
      editingTransactionId: opts?.transactionId ?? null,
      defaultType: opts?.type ?? "EXPENSE",
      repayLoanId: opts?.repayLoanId ?? null,
      defaultDate: opts?.date ?? null,
      party: opts?.party ?? null,
    }),
  close: () => set({ isOpen: false, editingTransactionId: null, repayLoanId: null, defaultDate: null, party: null }),
}));
