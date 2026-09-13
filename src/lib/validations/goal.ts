import { z } from "zod";
import { SWATCH_IDS } from "@/lib/colors";

export const goalSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  targetAmount: z.number().positive("Enter a target amount"),
  targetDate: z.date().nullable().optional(),
  accountId: z.string().nullable().optional(),
  icon: z.string().min(1),
  color: z.enum(SWATCH_IDS as [string, ...string[]]),
});
export type GoalInput = z.infer<typeof goalSchema>;

export const contributeSchema = z.object({
  amount: z.number().positive("Enter an amount"),
});
export type ContributeInput = z.infer<typeof contributeSchema>;
