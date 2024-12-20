import { container } from "@/container";
import { z } from "zod";

const categoryRepository = container.categoryRepository;
const tutorRepository = container.tutorRepository;
const learnerRepository = container.learnerRepository;
const tutoriesRepository = container.tutoriesRepository;

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
  name: z
    .string()
    .min(3, { message: "Tutories name must be at least 3 characters" })
    .max(30, { message: "Tutoires name must be at most 30 characters" }),
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
    .min(5000, { message: "Hourly rate must be at least Rp. 5,000" })
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
      .or(z.array(z.string()))
      .superRefine(async (categoryId, ctx) => {
        let exists: boolean;
        if (Array.isArray(categoryId)) {
          exists = await Promise.all(
            categoryId.map((id) => categoryRepository.checkCategoryExists(id)),
          ).then((results) => results.every((result) => result));
        } else {
          exists = await categoryRepository.checkCategoryExists(categoryId);
        }

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
    city: z.string().or(z.array(z.string())).optional(),
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
export type CreateTutories = z.infer<typeof createTutoriesSchema>["body"];

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
export type UpdateTutories = z.infer<typeof updateTutoriesSchema>["body"];

export const deleteTutoriesSchema = z.object({
  params: z.object({
    tutoriesId: z.string(),
  }),
});

export const trackInteractionSchema = z.object({
  params: z.object({
    tutoriesId: z.string().superRefine(async (tutoriesId, ctx) => {
      const exists = await tutoriesRepository.checkTutoriesExists(tutoriesId);
      if (!exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tutories does not exist",
        });
      }
    }),
  }),
});
