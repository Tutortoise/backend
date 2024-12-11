import {
  jwtAuthMiddleware,
  verifyLearner,
} from "@/module/auth/auth.middleware";
import { validator } from "@middleware/validation.middleware";
import { Router } from "express";
import * as reviewController from "./review.controller";
import {
  createReviewSchema,
  dismissReviewSchema,
  getReviewsSchema,
} from "./review.schema";

const reviewRouter = Router();

// Public routes
reviewRouter.get(
  "/tutories/:tutoriesId",
  // #swagger.tags = ['reviews']
  // #swagger.description = 'Get reviews of a tutories'
  validator(getReviewsSchema),
  reviewController.getTutoriesReviews,
);

// Protected routes
reviewRouter.use(jwtAuthMiddleware);
reviewRouter.use(verifyLearner);

reviewRouter.post(
  "/orders/:orderId",
  /* #swagger.tags = ['reviews']
  #swagger.description = 'Create review for an order'
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/CreateReviewSchema" }
  } */
  validator(createReviewSchema),
  reviewController.createReview,
);

reviewRouter.post(
  "/orders/:orderId/dismiss",
  // #swagger.tags = ['reviews']
  // #swagger.description = 'Dismiss review prompt'
  validator(dismissReviewSchema),
  reviewController.dismissReviewPrompt,
);

export default reviewRouter;
