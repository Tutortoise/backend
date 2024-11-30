import { z } from "zod";
import { AuthRepository } from "./auth.repository";
import { db } from "@/db/config";

const authRepository = new AuthRepository(db);

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z
      .string()
      .email("Invalid email address")
      .superRefine(async (email, ctx) => {
        const exists = await authRepository.checkEmailExists(email);
        if (exists) {
          return ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Email already exists",
          });
        }
      }),
    role: z.enum(["learner", "tutor"], {
      message: "Role must be either 'learner' or 'tutor'",
    }),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string(),
  }),
});

export const changePasswordSchema = z
  .object({
    body: z.object({
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string(),
    }),
  })
  .refine((data) => data.body.newPassword === data.body.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const fcmTokenSchema = z.object({
  body: z.object({
    token: z.string(),
  }),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type FCMTokenSchema = z.infer<typeof fcmTokenSchema>;

export const oAuthSchema = z.object({
  body: z.object({
    idToken: z.string(),
    role: z.enum(["learner", "tutor"]).optional(),
  }),
});

export type OAuthSchema = z.infer<typeof oAuthSchema>;
