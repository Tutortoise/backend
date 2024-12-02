import { container } from "@/container";
import { z } from "zod";

const categoryRepository = container.categoryRepository;
const tutorRepository = container.tutorRepository;

export const tutoriesSchema = z.object({
  id: z.string().optional(),
  tutorId: z.string().superRefine(async (tutorId, ctx) => {
    const exists = await tutorRepository.checkTutorExists(tutorId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tutor does not exist",
      });
    }
  }),
  categoryId: z.string().superRefine(async (categoryId, ctx) => {
    const exists = await categoryRepository.checkCategoryExists(categoryId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Category does not exist",
      });
    }
  }),
  // About the tutor's experience
  aboutYou: z
    .string()
    .min(10, {
      message: "You must at least write your experience in 10 characters",
    })
    .max(1500, {
      message: "You must at most write your experience in 1500 characters",
    }),
  // Tutor's teaching methodology
  teachingMethodology: z
    .string()
    .min(10, {
      message: "Teaching methodology must be at least 10 characters",
    })
    .max(1500, {
      message: "Teaching methodology must be at most 1500 characters",
    }),
  hourlyRate: z
    .number()
    .min(10000, { message: "Hourly rate must be at least Rp. 10,000" })
    .max(1000000, { message: "Hourly rate must be at most Rp. 1,000,000" }),
  // Tutor's teaching mode (online, offline, or both)
  typeLesson: z.enum(["online", "offline", "both"], {
    message: "Teaching type must be either 'online', 'offline', or 'both'",
  }),
  isEnabled: z.boolean().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export const getTutoriesSchema = z.object({
  query: z.object({
    q: z.string().optional(), // search query
    categoryId: z
      .string()
      .superRefine(async (categoryId, ctx) => {
        const exists = await categoryRepository.checkCategoryExists(categoryId);
        if (!exists) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Category does not exist",
          });
        }
      })
      .optional(),
    minHourlyRate: z.string().optional(),
    maxHourlyRate: z.string().optional(),
    minRating: z.string().optional(),
    typeLesson: z
      .enum(["online", "offline", "both"], {
        message: "Teaching type must be either 'online', 'offline', or 'both'",
      })
      .optional(),
    city: z.string().optional(),
  }),
});

export const getServiceSchema = z.object({
  params: z.object({
    tutoriesId: z.string(),
  }),
});

export const getAverageRateSchema = z.object({
  query: z.object({
    categoryId: z.string().superRefine(async (categoryId, ctx) => {
      const exists = await categoryRepository.checkCategoryExists(categoryId);
      if (!exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Category does not exist",
        });
      }
    }),
    city: z.string().optional(),
    district: z.string().optional(),
  }),
});

export const createTutoriesSchema = z.object({
  body: tutoriesSchema.omit({
    id: true,
    tutorId: true, // can directly get from req.tutor.id
    createdAt: true,
    updatedAt: true,
  }),
});

export const updateTutoriesSchema = z.object({
  body: tutoriesSchema
    .omit({
      id: true,
      tutorId: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
    })
    .partial(),
  params: z.object({
    tutoriesId: z.string(),
  }),
});

export const deleteTutorServiceSchema = z.object({
  params: z.object({
    tutoriesId: z.string(),
  }),
});
