import { z } from "zod";
import { SWATCH_IDS } from "@/lib/colors";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().min(1),
  color: z.enum(SWATCH_IDS as [string, ...string[]]),
});
export type CategoryInput = z.infer<typeof categorySchema>;
