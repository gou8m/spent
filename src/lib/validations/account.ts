import { z } from "zod";
import { ACCOUNT_TYPES, BANK_SUBTYPES } from "@/lib/constants";
import { SWATCH_IDS } from "@/lib/colors";

const accountTypeValues = ACCOUNT_TYPES.map((t) => t.value) as [string, ...string[]];
const bankSubtypeValues = BANK_SUBTYPES.map((t) => t.value) as [string, ...string[]];

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  type: z.enum(accountTypeValues),
  bankSubtype: z.enum(bankSubtypeValues).optional(),
  currency: z.string().length(3),
  startingBalance: z.number().finite(),
  creditLimit: z.number().finite().positive().optional(),
  allowExpense: z.boolean().optional(),
  icon: z.string().min(1),
  color: z.enum(SWATCH_IDS as [string, ...string[]]),
});
export type AccountInput = z.infer<typeof accountSchema>;
