import {
  createTutorServiceSchema,
  updateTutorServiceSchema,
} from "@/module/tutories/tutories.schema";
import { logger } from "@middleware/logging.middleware";
import { z } from "zod";
import { TutoriesRepository } from "./tutories.repository";

export interface TutorServiceServiceDependencies {
  tutoriesRepository: TutoriesRepository;
}

type GetTutorServicesFilters = {
  q?: string | null;
  subjectId?: string | null;
  minHourlyRate?: number | null;
  maxHourlyRate?: number | null;
  typeLesson?: "online" | "offline" | "both" | null;
  city?: string | null;
  tutorId?: string | null;
};

export class TutoriesService {
  private tutoriesRepository: TutoriesRepository;

  constructor({ tutoriesRepository }: TutorServiceServiceDependencies) {
    this.tutoriesRepository = tutoriesRepository;
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
    return await this.tutoriesRepository.getTutories({
      q: filters.q,
      subjectId: filters.subjectId,
      minHourlyRate: filters.minHourlyRate,
      maxHourlyRate: filters.maxHourlyRate,
      typeLesson: filters.typeLesson,
      tutorId: filters.tutorId,
      city: filters.city,
    });
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
    data: z.infer<typeof createTutorServiceSchema>["body"],
  ) {
    try {
      await this.tutoriesRepository.createTutories(tutorId, data);
    } catch (error) {
      logger.error(`Failed to create tutories: ${error}`);
    }
  }

  async updateTutories(
    tutoriesId: string,
    data: z.infer<typeof updateTutorServiceSchema>["body"],
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

  async validateTutoriesOwnership(tutoriesId: string, tutorId: string) {
    try {
      return await this.tutoriesRepository.validateTutoriesOwnership(
        tutoriesId,
        tutorId,
      );
    } catch (error) {
      logger.error(`Failed to validate tutories ownership: ${error}`);
    }
  }
}
