import axios from "axios";
import {
  Recommendation,
  RecommendationService,
  RecommendationServiceResponse,
} from "./recommendation.interface";
import { logger } from "@middleware/logging.middleware";
import { TutoriesRepository } from "../tutories/tutories.repository";
import { LearnerRepository } from "../learner/learner.repository";

export class RemoteRecommendationService implements RecommendationService {
  constructor(private readonly baseUrl: string) {}

  async trackInteraction(learnerId: string, tutoriesId: string): Promise<void> {
    try {
      axios.get(`${this.baseUrl}/interaction/${learnerId}/${tutoriesId}`);
    } catch (error) {
      logger.error("Recommendation service error:", error);
      throw new Error("Recommendation service unavailable");
    }
  }

  async getRecommendations(
    learnerId: string,
  ): Promise<RecommendationServiceResponse> {
    try {
      const response = await axios.get<RecommendationServiceResponse>(
        `${this.baseUrl}/recommendations/${learnerId}`,
        { timeout: 5000 },
      );

      return response.data;
    } catch (error) {
      logger.error("Recommendation service error:", error);
      throw new Error("Recommendation service unavailable");
    }
  }

  checkHealthSync(): boolean {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", `${this.baseUrl}/health`, false); // Make the request synchronous
      xhr.timeout = 5000;
      xhr.send(null);

      return xhr.status === 200;
    } catch (error) {
      logger.warn("Health check failed:", error);
      return false;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
      });
      return response.data.status === "healthy";
    } catch (error) {
      return false;
    }
  }
}

export class InterestRecommendationService implements RecommendationService {
  constructor(
    private readonly learnerRepository: LearnerRepository,
    private readonly tutoriesRepository: TutoriesRepository,
  ) {}

  async trackInteraction(learnerId: string, tutoriesId: string): Promise<void> {
    // No-op
  }

  async getRecommendations(
    learnerId: string,
  ): Promise<RecommendationServiceResponse> {
    const learner = await this.learnerRepository.getLearnerById(learnerId);
    if (!learner) {
      throw new Error("Learner not found");
    }

    const recommendations: Recommendation[] =
      await this.tutoriesRepository.getTutoriesByLearnerInterests(learnerId);

    const result: RecommendationServiceResponse = {
      learner: {
        id: learner.id,
        name: learner.name,
        email: learner.email,
        learning_style: learner.learningStyle,
        city: learner.city,
        district: learner.district,
        interests: learner.interests,
      },
      recommendations,
      total_found: 0,
      requested: 0,
    };

    return result;
  }

  checkHealthSync(): boolean {
    return true;
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }
}
