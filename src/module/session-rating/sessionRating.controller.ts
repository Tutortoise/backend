import { Controller } from "@/types";
import { SessionRatingService } from "./sessionRating.service";
import { firestore } from "@/config";
import { logger } from "@middleware/logging.middleware";
import { z } from "zod";
import { createSessionRatingSchema } from "./sessionRating.schema";

const sessionRatingService = new SessionRatingService({
  firestore,
});

export const getTutorSessionRatings: Controller = async (req, res) => {
  try {
    const ratings = await sessionRatingService.getSessionRatingByServiceId(
      req.tutor.id,
    );

    res.json({ status: "success", data: ratings });
  } catch (error) {
    logger.error(`Failed to get tutor session ratings: ${error}`);

    res.status(500).json({
      status: "error",
      message: "Failed to get tutor session ratings",
    });
  }
};

type CreateSessionRatingSchema = z.infer<typeof createSessionRatingSchema>;
export const createSessionRating: Controller<
  CreateSessionRatingSchema
> = async (req, res) => {
  try {
    await sessionRatingService.createSessionRating(req.learner.id, req.body);

    res.status(201).json({
      status: "success",
      message: "Session rating created successfully",
    });
  } catch (error) {
    logger.error(`Failed to create session rating: ${error}`);

    if (error instanceof Error) {
      res.status(400).json({
        status: "fail",
        message: error.message,
      });
    }
  }
};
