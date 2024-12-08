import { container } from "@/container";
import { Controller } from "@/types";
import { z } from "zod";
import { logger } from "@middleware/logging.middleware";
import { ReviewService } from "./review.service";
import {
  createReviewSchema,
  dismissReviewSchema,
  getReviewsSchema,
} from "./review.schema";

const reviewService = new ReviewService({
  reviewRepository: container.reviewRepository,
  orderRepository: container.orderRepository,
  abusiveDetection: container.abusiveDetectionService,
});

type CreateReviewSchema = z.infer<typeof createReviewSchema>;
export const createReview: Controller<CreateReviewSchema> = async (
  req,
  res,
) => {
  try {
    const learnerId = req.learner.id;
    const { orderId } = req.params;
    const { rating, message } = req.body;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({
        status: "fail",
        message: "Rating must be a whole number between 1 and 5",
      });
      return;
    }

    // Validate that the learner owns this order
    const isValidOrder = await reviewService.validateOrderOwnership(
      orderId,
      learnerId,
    );
    if (!isValidOrder) {
      res.status(403).json({
        status: "fail",
        message: "You can only review orders that you've made",
      });
      return;
    }

    // Check if order is completed
    const isCompleted = await reviewService.isOrderCompleted(orderId);
    if (!isCompleted) {
      res.status(400).json({
        status: "fail",
        message: "You can only review completed orders",
      });
      return;
    }

    // Check if review already exists
    const hasReview = await reviewService.hasReview(orderId);
    if (hasReview) {
      res.status(400).json({
        status: "fail",
        message: "You have already reviewed this order",
      });
      return;
    }

    const review = await reviewService.createReview({
      orderId,
      rating,
      message,
    });

    res.status(201).json({
      status: "success",
      message: "Review created successfully",
      data: review,
    });
  } catch (error) {
    logger.error(`Failed to create review: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Failed to create review",
    });
  }
};

type GetReviewsSchema = z.infer<typeof getReviewsSchema>;
export const getTutoriesReviews: Controller<GetReviewsSchema> = async (
  req,
  res,
) => {
  try {
    const { tutoriesId } = req.params;
    const reviews = await reviewService.getTutoriesReviews(tutoriesId);

    res.json({
      status: "success",
      data: reviews,
    });
  } catch (error) {
    logger.error(`Failed to get reviews: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Failed to get reviews",
    });
  }
};

type DismissReviewSchema = z.infer<typeof dismissReviewSchema>;
export const dismissReviewPrompt: Controller<DismissReviewSchema> = async (
  req,
  res,
) => {
  try {
    const learnerId = req.learner.id;
    const { orderId } = req.params;

    // Validate that the learner owns this order
    const isValidOrder = await reviewService.validateOrderOwnership(
      orderId,
      learnerId,
    );
    if (!isValidOrder) {
      res.status(403).json({
        status: "fail",
        message:
          "You can only dismiss review prompt for orders that you've made",
      });
      return;
    }

    await reviewService.dismissReviewPrompt(orderId);

    res.json({
      status: "success",
      message: "Review prompt dismissed successfully",
    });
  } catch (error) {
    logger.error(`Failed to dismiss review: ${error}`);
    res.status(500).json({
      status: "error",
      message: "Failed to dismiss review",
    });
  }
};
