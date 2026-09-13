import { z } from "zod";

/** Shared policy for any *newly chosen* password (signup, reset, change) —
 * not applied to a "current password" field, which only proves you know an
 * already-existing password and may predate this policy. */
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number")
  .regex(/[^A-Za-z0-9]/, "Include at least one symbol");
