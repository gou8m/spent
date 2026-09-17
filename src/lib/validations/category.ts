import { z } from "zod";
import { SWATCH_IDS } from "@/lib/colors";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().min(1),
  color: z.enum(SWATCH_IDS as [string, ...string[]]),
  /** Empty/omitted means top-level. Depth is capped at 1 (a subcategory can't itself
   * have a parent) — enforced in the action layer, where the parent's own type and
   * childlessness are also checked. */
  parentId: z.string().optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;
