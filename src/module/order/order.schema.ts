import { auth, bucket, firestore } from "@/config";
import { downscaleImage } from "@/helpers/image.helper";
import { LearnerService } from "@/module/learner/learner.service";
import { TutorServiceService } from "@/module/tutor-service/tutorService.service";
import { z, ZodIssueCode } from "zod";
import { OrderService } from "./order.service";

const learnerService = new LearnerService({
  firestore,
  auth,
  downscaleImage,
  bucket,
});

const tutorServiceService = new TutorServiceService({
  firestore,
});

const orderService = new OrderService({
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
  sessionTime: z.string().superRefine((sessionTime, ctx) => {
    if (new Date(sessionTime) < new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Session time must be in the future",
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
  status: z.enum(["pending", "declined", "canceled", "scheduled", "completed"]),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const getMyOrdersSchema = z.object({
  query: z.object({
    status: z.enum(["pending", "scheduled", "completed"]),
  }),
});

export const createOrderSchema = z
  .object({
    body: orderSchema.omit({
      id: true,
      status: true,
      learnerId: true, // Get learnerId from req.learner
      createdAt: true,
      updatedAt: true,
    }),
  })
  .superRefine(async (data, ctx) => {
    const availabilityList =
      await tutorServiceService.getTutorServiceAvailability(
        data.body.tutorServiceId,
      );

    const sessionDate = new Date(data.body.sessionTime);
    if (!availabilityList.includes(sessionDate.toISOString())) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "Tutor is not available at this time",
        path: ["body", "sessionTime"],
      });
    }
  });

export const cancelOrderSchema = z.object({
  params: z.object({
    orderId: z.string().superRefine(async (orderId, ctx) => {
      const exists = await orderService.checkOrderExists(orderId);
      if (!exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Order does not exist",
        });
      }
    }),
  }),
});

export const acceptOrderSchema = z.object({
  params: z.object({
    orderId: z.string().superRefine(async (orderId, ctx) => {
      const exists = await orderService.checkOrderExists(orderId);
      if (!exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Order does not exist",
        });
      }
    }),
  }),
});

export const declineOrderSchema = z.object({
  params: z.object({
    orderId: z.string().superRefine(async (orderId, ctx) => {
      const exists = await orderService.checkOrderExists(orderId);
      if (!exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Order does not exist",
        });
      }
    }),
  }),
});
