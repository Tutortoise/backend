import { container } from "@/container";
import { z, ZodIssueCode } from "zod";

const learnerRepository = container.learnerRepository;
const tutoriesRepository = container.tutoriesRepository;
const tutorRepository = container.tutorRepository;
const orderRepository = container.orderRepository;

export const orderSchema = z.object({
  id: z.string().optional(),
  learnerId: z.string().superRefine(async (learnerId, ctx) => {
    const exists = await learnerRepository.checkLearnerExists(learnerId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Learner does not exist",
      });
    }
  }),
  tutoriesId: z.string().superRefine(async (tutoriesId, ctx) => {
    const exists = await tutoriesRepository.checkTutoriesExists(tutoriesId);
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tutories does not exist",
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
  typeLesson: z.enum(["online", "offline"]),
  status: z.enum(["pending", "declined", "scheduled", "completed"]),
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
    const tutories = await tutoriesRepository.getTutoriesById(
      data.body.tutoriesId,
    );
    const availabilityList = await tutorRepository.getAvailability(
      tutories.tutorId,
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

export const changeOrderStatusSchema = z.object({
  params: z.object({
    orderId: z.string().superRefine(async (orderId, ctx) => {
      const exists = await orderRepository.checkOrderExists(orderId);
      if (!exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Order does not exist",
        });
      }
    }),
  }),
});
