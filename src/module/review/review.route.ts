import {
  jwtAuthMiddleware,
  verifyLearner,
} from "@/module/auth/auth.middleware";
import { validator } from "@middleware/validation.middleware";
import { Router } from "express";
import * as reviewController from "./review.controller";
import { createReviewSchema, getReviewsSchema } from "./review.schema";

const reviewRouter = Router();

// Public routes
reviewRouter.get(
  "/tutories/:tutoriesId",
  // #swagger.tags = ['reviews']
  validator(getReviewsSchema),
  reviewController.getTutoriesReviews,
);

// Protected routes
reviewRouter.use(jwtAuthMiddleware);
reviewRouter.use(verifyLearner);

reviewRouter.post(
  "/orders/:orderId",
  /* #swagger.tags = ['reviews']
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/CreateReviewSchema" }
  } */
  validator(createReviewSchema),
  reviewController.createReview,
);

export default reviewRouter;
