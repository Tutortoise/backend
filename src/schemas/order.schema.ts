import { auth, firestore, GCS_BUCKET_NAME } from "@/config";
import { downscaleImage } from "@/helpers/image.helper";
import { Storage } from "@google-cloud/storage";
import { LearnerService } from "@services/learner.service";
import { TutorService } from "@services/tutor.service";
import { TutorServiceService } from "@services/tutorService.service";
import { z } from "zod";

const tutorService = new TutorService({
  firestore,
  auth,
  downscaleImage,
  GCS_BUCKET_NAME,
  storage: new Storage(),
});
const learnerService = new LearnerService({
  firestore,
  auth,
  downscaleImage,
  GCS_BUCKET_NAME,
  storage: new Storage(),
});

const tutorServiceService = new TutorServiceService({
  firestore,
});

export const orderSchema = z.object({
  id: z.string().optional(),
  learnerId: z.string().superRefine(async (learnerId, ctx) => {
    const exists = await learnerService.checkLearnerExists(learnerId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Learner does not exist",
      });
    }
  }),
  tutorId: z.string().superRefine(async (tutorId, ctx) => {
    const exists = await tutorService.checkTutorExists(tutorId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tutor does not exist",
      });
    }
  }),
  tutorServiceId: z.string().superRefine(async (serviceId, ctx) => {
    const exists = await tutorServiceService.checkServiceExists(serviceId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tutor service does not exist",
      });
    }
  }),
  totalHours: z
    .number()
    .min(1, { message: "Total hours must be at least 1" })
    .max(5, { message: "Total hours must be at most 5" }),
  notes: z
    .string()
    .max(1000, { message: "Note must be at most 1000 characters" })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
