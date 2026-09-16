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

interface NavProgressState {
  active: boolean;
  /** Bumped on every start() so TopProgressBar's effect restarts its creep
   * animation even if a new navigation begins before the last one finished. */
  key: number;
  start: () => void;
  finish: () => void;
}

export const useNavProgress = create<NavProgressState>((set) => ({
  active: false,
  key: 0,
  start: () => set((s) => ({ active: true, key: s.key + 1 })),
  finish: () => set({ active: false }),
}));
