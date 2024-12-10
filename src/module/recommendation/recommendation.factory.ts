import { SYSTEM_RECOMMENDER_ENABLED, SYSTEM_RECOMMENDER_URL } from "@/config";
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
  if (process.env.NODE_ENV === "test" || !SYSTEM_RECOMMENDER_ENABLED) {
    logger.info(
      "Recommendation service is disabled, using simple interest-matching service",
    );
    return new InterestRecommendationService(
      learnerRepository,
      tutoriesRepository,
    );
  }

  const service = new RemoteRecommendationService(SYSTEM_RECOMMENDER_URL!);

  try {
    axios
      .get(`${SYSTEM_RECOMMENDER_URL}/health`, {
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
