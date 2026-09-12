import { z } from "zod";

export const transactionSchema = z
  .object({
    type: z.enum(["EXPENSE", "INCOME", "TRANSFER"]),
    amount: z.number().positive("Amount must be greater than 0"),
    currency: z.string().length(3),
    accountId: z.string().min(1, "Choose an account"),
    transferToAccountId: z.string().min(1).optional(),
    categoryId: z.string().min(1).optional(),
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
      ctx.addIssue({ code: "custom", message: "Choose a category", path: ["categoryId"] });
    }
  });
export type TransactionInput = z.infer<typeof transactionSchema>;
