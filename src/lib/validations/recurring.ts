import { z } from "zod";
import { RECURRING_FREQUENCIES } from "@/lib/constants";

export const recurringSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    amount: z.number().positive("Amount must be greater than 0"),
    type: z.enum(["EXPENSE", "INCOME"]),
    accountId: z.string().min(1, "Choose an account"),
    categoryId: z.string().min(1).optional(),
    frequency: z.enum(RECURRING_FREQUENCIES),
    interval: z.number().int().min(1, "Must be at least 1").max(365),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    isSubscription: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.categoryId) {
      ctx.addIssue({ code: "custom", message: "Choose a category", path: ["categoryId"] });
    }
    if (data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({ code: "custom", message: "End date must be after the start date", path: ["endDate"] });
    }
  });
export type RecurringInput = z.infer<typeof recurringSchema>;
