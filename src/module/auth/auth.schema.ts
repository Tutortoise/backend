import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    role: z.enum(["learner", "tutor"], {
      message: "Role must be either 'learner' or 'tutor'",
    }),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

export const changePasswordSchema = z
  .object({
    body: z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string(),
    }),
  })
  .refine((data) => data.body.newPassword === data.body.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
