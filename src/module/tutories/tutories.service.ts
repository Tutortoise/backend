import {
  createTutoriesSchema,
  updateTutoriesSchema,
} from "@/module/tutories/tutories.schema";
import { logger } from "@middleware/logging.middleware";
import { z } from "zod";
import { TutoriesRepository } from "./tutories.repository";
import { ReviewRepository } from "@/module/review/review.repository";

export interface TutorServiceServiceDependencies {
  tutoriesRepository: TutoriesRepository;
  reviewRepository: ReviewRepository;
}

type GetTutorServicesFilters = {
  q?: string | null;
  subjectId?: string | null;
  minHourlyRate?: number | null;
  maxHourlyRate?: number | null;
  typeLesson?: "online" | "offline" | "both" | null;
  city?: string | null;
  tutorId?: string | null;
  minRating?: number | null;
};

export class TutoriesService {
  private tutoriesRepository: TutoriesRepository;
  private reviewRepository: ReviewRepository;

  constructor({
    tutoriesRepository,
    reviewRepository,
  }: TutorServiceServiceDependencies) {
    this.tutoriesRepository = tutoriesRepository;
    this.reviewRepository = reviewRepository;
  }

  // TODO: Implement realtime updates for tutor service availability
  // - Use Realtime Database to track tutor online status
  // - Show real-time booking availability
  // - Update tutor's current location for nearby search

  // TODO: Add FCM notifications for service updates
  // - Notify learners when tutor services they're interested in change
  // - Send booking confirmation notifications
  // - Alert tutors of new booking requests
  async getTutories(filters: GetTutorServicesFilters) {
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
      const service =
        await this.tutoriesRepository.getTutoriesDetail(tutoriesId);
      return service;
    } catch (error) {
      logger.error(`Failed to get tutories detail: ${error}`);
    }
  }

  async getTutoriesAvailability(tutoriesId: string) {
    try {
      const availability =
        await this.tutoriesRepository.getTutoriesAvailability(tutoriesId);

      return availability;
    } catch (error) {
      logger.error(`Failed to get tutories availability: ${error}`);
    }
  }

  async createTutorService(
    tutorId: string,
    data: z.infer<typeof createTutoriesSchema>["body"],
  ) {
    try {
      const [{ id }] = await this.tutoriesRepository.createTutories(
        tutorId,
        data,
      );
      return { tutoriesId: id };
    } catch (error) {
      logger.error(`Failed to create tutories: ${error}`);
    }
  }

  async updateTutories(
    tutoriesId: string,
    data: z.infer<typeof updateTutoriesSchema>["body"],
  ) {
    try {
      await this.tutoriesRepository.updateTutories(tutoriesId, data);
    } catch (error) {
      logger.error(`Failed to update tutories: ${error}`);
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
