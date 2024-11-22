import { z } from "zod";
import { LearnerService } from "../learner/learner.service";
import { auth, bucket, firestore } from "@/config";
import { downscaleImage } from "@/helpers/image.helper";
import { TutorServiceService } from "../tutor-service/tutorService.service";
import { OrderService } from "../order/order.service";

const learnerService = new LearnerService({
  auth,
  firestore,
  downscaleImage,
  bucket,
});

const tsService = new TutorServiceService({
  firestore,
});

export const sessionRatingSchema = z.object({
  id: z.string().optional(),
  learnerId: z.string().superRefine(async (learnerId, ctx) => {
    const exists = await learnerService.checkLearnerExists(learnerId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "learner does not exist",
      });
    }
  }),
  tutorServiceId: z
    .string()
    .min(1)
    .superRefine(async (serviceId, ctx) => {
      const exists = await tsService.checkServiceExists(serviceId);
      if (!exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tutor service does not exist",
        });
      }
    }),
  orderId: z.string().superRefine(async (orderId, ctx) => {
    const order = await firestore.collection("orders").doc(orderId).get();
    if (!order.exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Order does not exist",
      });
    }
  }),
  message: z.string().max(1000, "Message must be at most 1000 characters"),
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export const createSessionRatingSchema = z.object({
  body: sessionRatingSchema.omit({
    id: true,
    learnerId: true,
    createdAt: true,
    updatedAt: true,
  }),
});

export type SessionRating = z.infer<typeof sessionRatingSchema>;
