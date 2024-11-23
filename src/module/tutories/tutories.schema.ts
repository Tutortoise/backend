import { container } from "@/container";
import { z } from "zod";

const subjectRepository = container.subjectRepository;
const tutorRepository = container.tutorRepository;

const zodTimesArray = z
  .array(z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"))
  .optional();

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
  subjectId: z.string().superRefine(async (subjectId, ctx) => {
    const exists = await subjectRepository.checkSubjectExists(subjectId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Subject does not exist",
      });
    }
  }),
  // About the tutor's experience with the subject
  aboutYou: z
    .string()
    .min(10, {
      message:
        "You must at least write your experience with the subject in 10 characters",
    })
    .max(1500, {
      message:
        "You must at most write your experience with the subject in 1500 characters",
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
    ),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export const getServicesSchema = z.object({
  query: z.object({
    q: z.string().optional(), // search query
    subjectId: z.string().optional(),
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
      subjectId: true,
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
