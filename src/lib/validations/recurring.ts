import { z } from "zod";
import { MAX_MINOR_UNITS } from "@/lib/money";
import { RECURRING_FREQUENCIES } from "@/lib/constants";
import { DAY_RULES } from "@/lib/recurrence";

export const recurringSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    amount: z.number().positive("Amount must be greater than 0").max(MAX_MINOR_UNITS, "Amount is too large"),
    type: z.enum(["EXPENSE", "INCOME"]),
    accountId: z.string().min(1, "Choose an account"),
    // No `.min(1)` — see the identical comment in `validations/transaction.ts`.
    categoryId: z.string().optional(),
    frequency: z.enum(RECURRING_FREQUENCIES),
    interval: z.number().int().min(1, "Must be at least 1").max(365),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    isSubscription: z.boolean().default(false),
    // MONTHLY only: the start date's day, the last day of the month, or the last working day (salary).
    dayRule: z.enum(DAY_RULES).default("DAY"),
    // The amount changes each time: every occurrence waits for the real amount to be confirmed.
    amountVaries: z.boolean().default(false),
    // An extra amount every N months, counted from the start month (a quarterly bonus on top of a salary).
    bonusAmount: z.number().positive("Enter the bonus amount").max(MAX_MINOR_UNITS, "Amount is too large").optional(),
    bonusEveryMonths: z.number().int().min(1, "Must be at least 1").max(24, "Up to 24 months").optional(),
    // The start date is already recorded by hand (the "Repeat" chip in a new transaction): carry on from the next cycle.
    skipFirst: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.categoryId) {
      ctx.addIssue({ code: "custom", message: "Please select a category.", path: ["categoryId"] });
    }
    if (data.dayRule !== "DAY" && data.frequency !== "MONTHLY") {
      ctx.addIssue({ code: "custom", message: "Month-end dates work with monthly repeats", path: ["dayRule"] });
    }
    if ((data.bonusAmount === undefined) !== (data.bonusEveryMonths === undefined)) {
      ctx.addIssue({ code: "custom", message: "Enter both the bonus amount and how often", path: ["bonusAmount"] });
    }
    if (data.bonusAmount !== undefined && (data.type !== "INCOME" || data.frequency !== "MONTHLY")) {
      ctx.addIssue({ code: "custom", message: "A bonus is for monthly income", path: ["bonusAmount"] });
    }
    if (data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({ code: "custom", message: "End date must be after the start date", path: ["endDate"] });
    }
  });
export type RecurringInput = z.infer<typeof recurringSchema>;
