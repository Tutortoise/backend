import { container } from "@/container";
import { z } from "zod";

const authRepository = container.authRepository;
const tutorRepository = container.tutorRepository;

export const tutorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
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
    })
    .optional(),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  gender: z
    .enum(["male", "female", "prefer not to say"], {
      message:
        "Gender must be one of the following: male, female, or prefer not to say",
    })
    .optional(),
  services: z
    .array(z.string())
    .superRefine(async (services, ctx) => {
      const isServicesValid = await tutorRepository.validateServices(services);
      if (!isServicesValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid services",
        });
      }
    })
    .optional(),
  coverageRange: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  lastSeen: z.date().optional(),
});

export const updateProfileSchema = z.object({
  body: tutorSchema.omit({
    id: true,
    services: true,
    coverageRange: true,
    city: true,
    createdAt: true,
    updatedAt: true,
    lastSeen: true,
  }),
});
