import { auth, firestore, GCS_BUCKET_NAME } from "@/config";
import { downscaleImage } from "@/helpers/image.helper";
import { Storage } from "@google-cloud/storage";
import { SubjectService } from "@services/subject.service";
import { TutorService } from "@services/tutor.service";
import { z } from "zod";

const subjectService = new SubjectService({
  firestore,
});
const tutorService = new TutorService({
  firestore,
  auth,
  downscaleImage,
  GCS_BUCKET_NAME,
  storage: new Storage(),
});

export const tutorServiceSchema = z.object({
  id: z.string().optional(),
  tutorId: z.string().superRefine(async (tutorId, ctx) => {
    const exists = await tutorService.checkTutorExists(tutorId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tutor does not exist",
      });
    }
  }),
  subjectId: z.string().superRefine(async (subjectId, ctx) => {
    const exists = await subjectService.checkSubjectExists(subjectId);
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
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export const getServicesSchema = z.object({
  query: z.object({
    subjectId: z.string().optional(),
    minHourlyRate: z.string().optional(),
    maxHourlyRate: z.string().optional(),
    minRating: z.string().optional(),
  }),
});

export const createTutorServiceSchema = z.object({
  body: tutorServiceSchema.omit({
    id: true,
    tutorId: true, // can directly get from req.tutor.id
    createdAt: true,
    updatedAt: true,
  }),
});

export const updateTutorServiceSchema = z.object({
  body: tutorServiceSchema
    .omit({
      id: true,
      tutorId: true,
      subjectId: true,
      createdAt: true,
      updatedAt: true,
    })
    .partial(),
  params: z.object({
    tutorServiceId: z.string(),
  }),
});

export const deleteTutorServiceSchema = z.object({
  params: z.object({
    tutorServiceId: z.string(),
  }),
});
