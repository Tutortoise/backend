import { container } from "@/container";
import { z } from "zod";

const authRepository = container.authRepository;

const zodTimesArray = z
  .array(z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"))
  .optional();

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
  availability: z
    .object({
      0: zodTimesArray,
      1: zodTimesArray,
      2: zodTimesArray,
      3: zodTimesArray,
      4: zodTimesArray,
      5: zodTimesArray,
      6: zodTimesArray,
    })
    .refine(
      (availability) => {
        // Check if at least one day has a time slot
        return Object.values(availability).some((times) => times?.length);
      },
      { message: "At least one day must have a time slot" },
    )
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  lastSeen: z.date().optional(),
});

export const updateProfileSchema = z.object({
  body: tutorSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    lastSeen: true,
  }),
});
