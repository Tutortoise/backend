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
  // TODO: set max length
  aboutYou: z.string().min(10, {
    message:
      "You must at least write your experience with the subject in 10 characters",
  }),
  // Tutor's teaching methodology
  // TODO: set max length
  teachingMethodology: z.string().min(10, {
    message: "Teaching methodology must be at least 10 characters",
  }),
  // TODO: ganti minimum dan maximum price
  hourlyRate: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
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
