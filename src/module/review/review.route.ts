import { Router } from "express";
import * as reviewController from "./review.controller";
import {
  jwtAuthMiddleware,
  verifyLearner,
} from "@/module/auth/auth.middleware";
import { validator } from "@middleware/validation.middleware";
import { createReviewSchema, getReviewsSchema } from "./review.schema";

const reviewRouter = Router();

// Public routes
reviewRouter.get(
  "/tutories/:tutoriesId",
  validator(getReviewsSchema),
  reviewController.getTutoriesReviews,
);

// Protected routes
reviewRouter.use(jwtAuthMiddleware);
reviewRouter.use(verifyLearner);

reviewRouter.post(
  "/orders/:orderId",
  validator(createReviewSchema),
  reviewController.createReview,
);

export default reviewRouter;
