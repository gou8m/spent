import { z } from "zod";

export const budgetSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(60),
    amount: z.number().positive("Amount must be greater than 0"),
    period: z.enum(["WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    rollover: z.boolean(),
    color: z.string().min(1),
    icon: z.string().min(1),
    categoryIds: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.period === "CUSTOM" && !data.endDate) {
      ctx.addIssue({ code: "custom", message: "Custom periods need an end date", path: ["endDate"] });
    }
  });
export type BudgetInput = z.infer<typeof budgetSchema>;
