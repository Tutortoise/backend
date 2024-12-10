import {
  createTutoriesSchema,
  updateTutoriesSchema,
} from "@/module/tutories/tutories.schema";
import { logger } from "@middleware/logging.middleware";
import { z } from "zod";
import { TutoriesRepository } from "./tutories.repository";
import { ReviewRepository } from "@/module/review/review.repository";
import { ValidationError } from "../tutor/tutor.error";
import { TutorRepository } from "../tutor/tutor.repository";
import { GetTutoriesFilters } from "@/types";
import { AbusiveDetectionService } from "@/module/abusive-detection/abusive-detection.interface";
import { RecommendationService } from "../recommendation/recommendation.interface";

export interface TutorServiceServiceDependencies {
  tutoriesRepository: TutoriesRepository;
  tutorRepository: TutorRepository;
  reviewRepository: ReviewRepository;
  abusiveDetection: AbusiveDetectionService;
  recommender: RecommendationService;
}

export class TutoriesService {
  private tutoriesRepository: TutoriesRepository;
  private tutorRepository: TutorRepository;
  private reviewRepository: ReviewRepository;
  private abusiveDetection: AbusiveDetectionService;
  private recommender: RecommendationService;

  constructor({
    tutoriesRepository,
    tutorRepository,
    reviewRepository,
    abusiveDetection,
    recommender,
  }: TutorServiceServiceDependencies) {
    this.tutoriesRepository = tutoriesRepository;
    this.tutorRepository = tutorRepository;
    this.reviewRepository = reviewRepository;
    this.abusiveDetection = abusiveDetection;
    this.recommender = recommender;
  }

  private async validateContent(content: string, fieldName: string) {
    const result = await this.abusiveDetection.validateText(content);
    if (result.is_abusive) {
      throw new ValidationError(
        `${fieldName} contains inappropriate content${
          result.matched_words.length > 0
            ? `: ${result.matched_words.join(", ")}`
            : ""
        }`,
      );
    }
  }

  // TODO: Implement realtime updates for tutories availability
  // - Use Realtime Database to track tutor online status
  // - Show real-time booking availability
  // - Update tutor's current location for nearby search

  // TODO: Add FCM notifications for service updates
  // - Notify learners when tutor services they're interested in change
  // - Send booking confirmation notifications
  // - Alert tutors of new booking requests
  async getTutories(filters: GetTutoriesFilters) {
    const tutories = await this.tutoriesRepository.getTutories(filters);

    // Get ratings for all tutories in parallel
    const tutoriesWithRatings = await Promise.all(
      tutories.map(async (tutory) => {
        const { avgRating, totalReviews } =
          await this.reviewRepository.getAverageRating(tutory.id);
        return {
          ...tutory,
          avgRating,
          totalReviews,
        };
      }),
    );

    // Filter by minimum rating if specified
    if (filters.minRating !== null && filters.minRating !== undefined) {
      return tutoriesWithRatings.filter(
        (tutory) => tutory.avgRating >= filters.minRating!,
      );
    }

    // Sort by rating in descending order
    return tutoriesWithRatings.sort((a, b) => b.avgRating - a.avgRating);
  }

  async getTutoriesDetail(tutoriesId: string) {
    try {
      const [tutories, { avgRating, totalReviews }] = await Promise.all([
        await this.tutoriesRepository.getTutoriesDetail(tutoriesId),
        await this.reviewRepository.getAverageRating(tutoriesId),
      ]);

      return { ...tutories, avgRating, totalReviews };
    } catch (error) {
      logger.error(`Failed to get tutories detail: ${error}`);
    }
  }

  async getAverageRate({
    categoryId,
    city,
    district,
  }: {
    categoryId: string;
    city?: string;
    district?: string;
  }) {
    try {
      return await this.tutoriesRepository.getAverageHourlyRate({
        categoryId,
        city,
        district,
      });
    } catch (error) {
      logger.error(`Failed to get average rate: ${error}`);
    }
  }

  async getLocations() {
    try {
      return await this.tutorRepository.getLocations();
    } catch (error) {
      logger.error(`Failed to get all tutories location: ${error}`);
    }
  }

  async getRecommendations(learnerId: string) {
    try {
      return await this.recommender.getRecommendations(learnerId);
    } catch (error) {
      logger.error(`Failed to get recommendations: ${error}`);
    }
  }

  async trackInteraction(learnerId: string, tutoriesId: string) {
    try {
      await this.recommender.trackInteraction(learnerId, tutoriesId);
    } catch (error) {
      logger.error(`Failed to track interaction: ${error}`);
    }
  }

  async createTutories(
    tutorId: string,
    data: z.infer<typeof createTutoriesSchema>["body"],
  ) {
    try {
      const isTutorProfileComplete =
        await this.tutorRepository.isProfileComplete(tutorId);

      if (!isTutorProfileComplete) {
        throw new ValidationError("Tutor profile is incomplete");
      }

      await Promise.all([
        this.validateContent(data.aboutYou, "About you"),
        this.validateContent(data.teachingMethodology, "Teaching methodology"),
      ]);

      const [{ id }] = await this.tutoriesRepository.createTutories(
        tutorId,
        data,
      );
      return { tutoriesId: id };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Failed to create tutories: ${error}`);
      throw error;
    }
  }

  async updateTutories(
    tutoriesId: string,
    data: z.infer<typeof updateTutoriesSchema>["body"],
  ) {
    try {
      const validations = [];
      if (data.aboutYou)
        validations.push(this.validateContent(data.aboutYou, "About you"));
      if (data.teachingMethodology)
        validations.push(
          this.validateContent(
            data.teachingMethodology,
            "Teaching methodology",
          ),
        );

      await Promise.all(validations);
      await this.tutoriesRepository.updateTutories(tutoriesId, data);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Failed to update tutories: ${error}`);
      throw error;
    }
  }

  async deleteTutories(tutoriesId: string) {
    try {
      await this.tutoriesRepository.deleteTutories(tutoriesId);
    } catch (error) {
      logger.error(`Failed to delete tutories: ${error}`);
    }
  }

  async validateTutoriesOwnership({
    tutorId,
    tutoriesId,
  }: {
    tutorId: string;
    tutoriesId: string;
  }) {
    try {
      return await this.tutoriesRepository.validateTutoriesOwnership(
        tutorId,
        tutoriesId,
      );
    } catch (error) {
      logger.error(`Failed to validate tutories ownership: ${error}`);
    }
  }
}
