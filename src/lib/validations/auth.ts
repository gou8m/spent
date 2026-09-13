import { z } from "zod";
import { isDisposableEmail } from "@/lib/disposable-email-domains";
import { passwordSchema } from "@/lib/validations/password";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .refine((email) => !isDisposableEmail(email), "Please use a permanent email address"),
  password: passwordSchema,
  currency: z.string().length(3),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
