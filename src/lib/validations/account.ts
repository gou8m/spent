import { z } from "zod";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { SWATCH_IDS } from "@/lib/colors";

const accountTypeValues = ACCOUNT_TYPES.map((t) => t.value) as [string, ...string[]];

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  type: z.enum(accountTypeValues),
  currency: z.string().length(3),
  startingBalance: z.number().finite(),
  icon: z.string().min(1),
  color: z.enum(SWATCH_IDS as [string, ...string[]]),
  // CASH accounts only — count per denomination value (key), e.g. { "500": 2, "100": 5 }.
  cashDenominations: z.record(z.string(), z.number().int().nonnegative()).nullable().optional(),
});
export type AccountInput = z.infer<typeof accountSchema>;
