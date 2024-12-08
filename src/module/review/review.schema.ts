import { z } from "zod";

export const createReviewSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
  }),
  body: z.object({
    rating: z.number().min(1).max(5),
    message: z.string().max(500).optional(),
  }),
});

export const dismissReviewSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
  }),
});

export const getReviewsSchema = z.object({
  params: z.object({
    tutoriesId: z.string().uuid(),
  }),
});
