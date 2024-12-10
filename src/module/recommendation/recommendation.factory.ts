import { RECOMMENDATION_ENABLED, RECOMMENDATION_URL } from "@/config";
import {
  RemoteRecommendationService,
  InterestRecommendationService,
} from "./recommendation.service";
import { logger } from "@middleware/logging.middleware";
import axios from "axios";
import { LearnerRepository } from "../learner/learner.repository";
import { TutoriesRepository } from "../tutories/tutories.repository";

export const createRecommendationService = (
  learnerRepository: LearnerRepository,
  tutoriesRepository: TutoriesRepository,
) => {
  if (process.env.NODE_ENV === "test" || !RECOMMENDATION_ENABLED) {
    logger.info(
      "Recommendation service is disabled, using simple interest-matching service",
    );
    return new InterestRecommendationService(
      learnerRepository,
      tutoriesRepository,
    );
  }

  const service = new RemoteRecommendationService(RECOMMENDATION_URL!);

  try {
    axios
      .get(`${RECOMMENDATION_URL}/health`, {
        timeout: 5000,
      })
      .catch(() => {
        throw new Error("Health check failed");
      });

    logger.info("Recommendation service is healthy and ready");
    return service;
  } catch (error) {
    logger.warn(
      `Recommendation service is unavailable: ${error}, falling back to simple interest-matching service`,
    );
    return new InterestRecommendationService(
      learnerRepository,
      tutoriesRepository,
    );
  }
};
