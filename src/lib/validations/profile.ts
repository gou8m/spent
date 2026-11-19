import { z } from "zod";
import { AVATAR_IDS } from "@/lib/avatars";
import { isDisposableEmail } from "@/lib/disposable-email-domains";
import { passwordSchema } from "@/lib/validations/password";
import { birthDateError } from "@/lib/age";
import { normalizePhone } from "@/lib/phone";

export const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
});
export type NameInput = z.infer<typeof nameSchema>;

export const avatarPresetSchema = z.object({
  avatar: z.enum(AVATAR_IDS),
});
export type AvatarPresetInput = z.infer<typeof avatarPresetSchema>;

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

export const birthdaySchema = z.object({
  dateOfBirth: z.string().superRefine((v, ctx) => {
    const error = birthDateError(v);
    if (error) ctx.addIssue({ code: "custom", message: error });
  }),
});

/** The phone box, checked against the primary currency (it decides the country code for a local number). */
export const phoneSchemaFor = (currency: string) =>
  z.object({
    phone: z
      .string()
      .optional()
      .refine((v) => !v || normalizePhone(v, currency) !== null, "Enter a valid phone number"),
  });
