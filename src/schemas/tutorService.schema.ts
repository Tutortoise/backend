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
  aboutYou: z.string(),
  // Tutor's teaching methodology
  teachingMethodology: z.string(),
  hourlyRate: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});
