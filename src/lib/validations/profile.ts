import { z } from "zod";
import { AVATAR_IDS } from "@/lib/avatars";
import { isDisposableEmail } from "@/lib/disposable-email-domains";
import { passwordSchema } from "@/lib/validations/password";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  avatar: z.enum(AVATAR_IDS),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const emailChangeSchema = z.object({
  newEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .refine((email) => !isDisposableEmail(email), "Please use a permanent email address"),
});
export type EmailChangeInput = z.infer<typeof emailChangeSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
