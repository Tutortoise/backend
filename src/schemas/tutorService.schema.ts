import { checkSubjectExists } from "@services/subject.service";
import { checkTutorExists } from "@services/tutor.service";
import { z } from "zod";

export const tutorServiceSchema = z.object({
  id: z.string().optional(),
  tutorId: z.string().superRefine(async (tutorId, ctx) => {
    const exists = await checkTutorExists(tutorId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tutor does not exist",
      });
    }
  }),
  subjectId: z.string().superRefine(async (subjectId, ctx) => {
    const exists = await checkSubjectExists(subjectId);
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
