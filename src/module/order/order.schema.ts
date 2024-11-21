import { auth, bucket, firestore } from "@/config";
import { downscaleImage } from "@/helpers/image.helper";
import { LearnerService } from "@/module/learner/learner.service";
import { TutorServiceService } from "@/module/tutor-service/tutorService.service";
import { z } from "zod";

const learnerService = new LearnerService({
  firestore,
  auth,
  downscaleImage,
  bucket,
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
  tutorServiceId: z.string().superRefine(async (serviceId, ctx) => {
    const exists = await tutorServiceService.checkServiceExists(serviceId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tutor service does not exist",
      });
    }
  }),
  sessionTime: z.string(),
  totalHours: z
    .number()
    .min(1, { message: "Total hours must be at least 1" })
    .max(5, { message: "Total hours must be at most 5" }),
  notes: z
    .string()
    .max(1000, { message: "Note must be at most 1000 characters" })
    .optional(),
  status: z.enum(["pending", "declined", "scheduled", "completed"]),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const createOrderSchema = z.object({
  body: orderSchema.omit({
    id: true,
    status: true,
    learnerId: true, // Get learnerId from req.learner
    createdAt: true,
    updatedAt: true,
  }),
});
