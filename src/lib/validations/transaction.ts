import { z } from "zod";

export const transactionSchema = z
  .object({
    type: z.enum(["EXPENSE", "INCOME", "TRANSFER"]),
    amount: z.number().positive("Amount must be greater than 0"),
    currency: z.string().length(3),
    accountId: z.string().min(1, "Choose an account"),
    transferToAccountId: z.string().min(1).optional(),
    /** Amount credited to the destination account, in ITS currency — only meaningful
     * (and only sent by the form) when the two accounts' currencies differ. */
    transferToAmount: z.number().positive().optional(),
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
  });
export type TransactionInput = z.infer<typeof transactionSchema>;
