import { z } from "zod";
import { MAX_MINOR_UNITS } from "@/lib/money";

export const transactionSchema = z
  .object({
    type: z.enum(["EXPENSE", "INCOME", "TRANSFER"]),
    amount: z.number().positive("Amount must be greater than 0").max(MAX_MINOR_UNITS, "Amount is too large"),
    currency: z.string().length(3),
    accountId: z.string().min(1, "Choose an account"),
    transferToAccountId: z.string().min(1).optional(),
    /** Amount credited to the destination account, in ITS currency — only meaningful
     * (and only sent by the form) when the two accounts' currencies differ. */
    transferToAmount: z.number().positive().max(MAX_MINOR_UNITS, "Amount is too large").optional(),
    /** No `.min(1)` here deliberately — an unselected category arrives as `""`, and a
     * base-schema length check would fire *alongside* the superRefine below with zod's
     * own raw message ("Too small: expected string to have >=1 characters"), which the
     * form picks up first since base-schema issues are collected before refinements.
     * Emptiness is entirely the superRefine's job so only the friendly message ever
     * surfaces. */
    categoryId: z.string().optional(),
    title: z.string().trim().min(1, "Add a title").max(120),
    note: z.string().trim().max(500).optional().or(z.literal("")),
    date: z.coerce.date(),
    status: z.enum(["COMPLETED", "UPCOMING"]),
    tagIds: z.array(z.string()),
    /** Set when this transaction is informal lending — an "other transfer" EXPENSE
     * marked as money lent out, or an INCOME transaction marked as money borrowed.
     * See the Loan model (1:1 with Transaction) — createTransactionAction/
     * updateTransactionAction create/update/delete that row based on this field. */
    loan: z
      .object({
        direction: z.enum(["LENT", "BORROWED"]),
        counterpartyType: z.enum(["FRIEND", "FAMILY", "LENDER", "BANK", "OTHER"]).optional(),
        dueDate: z.coerce.date(),
        /** Charging (lent) or paying (borrowed) interest: a percent, per month or per year, simple
         * interest on the unpaid amount from the transaction date until it is paid. */
        interestRate: z.number().positive("Enter an interest rate above 0").max(1000, "That rate looks too high").optional(),
        interestPeriod: z.enum(["MONTH", "YEAR"]).optional(),
      })
      .optional(),
    /** Set when this transaction instead REPAYS existing loans (an Expense repaying ones you
     * borrowed, or an Income repaying ones you lent) — mutually exclusive with `loan` above. One
     * payment can cover several loans; the server splits the amount across them, oldest first,
     * interest before principal. Ownership/direction/amount checks happen in the action. */
    repaysLoanIds: z.array(z.string()).max(50).optional(),
    /** What to do with a loan that this payment only partly clears: keep it open and keep charging
     * interest (default), keep it open but stop interest, waive what is left, or move what is left
     * into a new interest-free loan. */
    settlement: z.enum(["KEEP", "STOP_INTEREST", "WAIVE", "NEW_LOAN"]).optional(),
    /** Marks incoming money (an income, or a transfer into one of your accounts) as set aside for
     * a goal saved in the account that receives it: the goal's saved amount grows by what arrived. */
    goalId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "TRANSFER") {
      if (!data.transferToAccountId) {
        ctx.addIssue({ code: "custom", message: "Choose a destination account", path: ["transferToAccountId"] });
      } else if (data.transferToAccountId === data.accountId) {
        ctx.addIssue({ code: "custom", message: "Pick two different accounts", path: ["transferToAccountId"] });
      }
    } else if (!data.categoryId) {
      ctx.addIssue({ code: "custom", message: "Please select a category.", path: ["categoryId"] });
    }

    if (data.goalId && data.type === "EXPENSE") {
      ctx.addIssue({ code: "custom", message: "Only money coming in can be set aside for a goal", path: ["goalId"] });
    }

    if (data.loan && data.repaysLoanIds?.length) {
      ctx.addIssue({ code: "custom", message: "A transaction can't both originate and repay a loan", path: ["loan"] });
    }

    if (data.loan) {
      if (data.loan.interestRate && !data.loan.interestPeriod) {
        ctx.addIssue({ code: "custom", message: "Choose per month or per year", path: ["loan", "interestPeriod"] });
      }
      if (data.loan.direction === "LENT" && data.type !== "EXPENSE") {
        ctx.addIssue({ code: "custom", message: "Lending can only be marked on an expense", path: ["loan"] });
      }
      if (data.loan.direction === "BORROWED") {
        if (data.type !== "INCOME") {
          ctx.addIssue({ code: "custom", message: "Borrowing can only be marked on income", path: ["loan"] });
        }
        if (!data.loan.counterpartyType) {
          ctx.addIssue({ code: "custom", message: "Choose who you borrowed from", path: ["loan", "counterpartyType"] });
        }
      }
    }
  });
export type TransactionInput = z.infer<typeof transactionSchema>;
