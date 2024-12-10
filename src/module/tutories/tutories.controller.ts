import { container } from "@/container";
import {
  createTutoriesSchema,
  deleteTutoriesSchema,
  getAverageRateSchema,
  getServiceSchema,
  getTutoriesSchema,
  trackInteractionSchema,
  updateTutoriesSchema,
} from "@/module/tutories/tutories.schema";
import { TutoriesService } from "@/module/tutories/tutories.service";
import { Controller, GetTutoriesFilters } from "@/types";
import { logger } from "@middleware/logging.middleware";
import { z } from "zod";
import { ValidationError } from "../tutor/tutor.error";

const tutoriesService = new TutoriesService({
  tutoriesRepository: container.tutoriesRepository,
  tutorRepository: container.tutorRepository,
  reviewRepository: container.reviewRepository,
  abusiveDetection: container.abusiveDetectionService,
  recommender: container.recommendationService,
});

type GetTutoriesSchema = z.infer<typeof getTutoriesSchema>;
export const getAllTutories: Controller<GetTutoriesSchema> = async (
  req,
  res,
) => {
  const {
    q,
    categoryId,
    minHourlyRate,
    maxHourlyRate,
    typeLesson,
    city,
    minRating,
  } = req.query;

  const filters: GetTutoriesFilters = {
    q: q || null,
    categoryId: categoryId || null,
    minHourlyRate: minHourlyRate ? parseInt(minHourlyRate as string) : null,
    maxHourlyRate: maxHourlyRate ? parseInt(maxHourlyRate as string) : null,
    typeLesson: typeLesson || null,
    minRating: minRating ? parseFloat(minRating as string) : null,
    city: city || null,
    isEnabled: true,
  };

  try {
    const tutories = await tutoriesService.getTutories(filters);

    res.json({
      status: "success",
      data: tutories,
    });
  } catch (error) {
    logger.error(`Failed to get tutories: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to get tutories`,
    });
  }
};

type GetServiceSchema = z.infer<typeof getServiceSchema>;
export const getTutories: Controller<GetServiceSchema> = async (
  req,
  res,
  next,
) => {
  const tutoriesId = req.params.tutoriesId;

  if (tutoriesId === "me") {
    next();
    return;
  }

  try {
    const tutories = await tutoriesService.getTutoriesDetail(tutoriesId);
    if (!tutories) {
      res.status(404).json({
        status: "error",
        message: "Tutories not found",
      });
      return;
    }

    res.json({
      status: "success",
      data: tutories,
    });
  } catch (error) {
    logger.error(`Failed to get tutor service: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to get tutor service`,
    });
  }
};

type GetAverageRateSchema = z.infer<typeof getAverageRateSchema>;
export const getAverageRate: Controller<GetAverageRateSchema> = async (
  req,
  res,
) => {
  try {
    const averageRate = await tutoriesService.getAverageRate({
      categoryId: req.query.categoryId,
      city: req.query.city,
      district: req.query.district,
    });

    res.json({
      status: "success",
      data: averageRate,
    });
  } catch (error) {
    logger.error(`Failed to get tutor services: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to get tutor services`,
    });
  }
};

export const getLocations: Controller = async (_req, res) => {
  try {
    const locations = await tutoriesService.getLocations();
    res.json({ status: "success", data: locations });
  } catch (error) {
    logger.error(`Failed to get all tutories location: ${error}`);
    res.status(500).json({
      status: "error",
      message: `Failed to get all tutories location`,
    });
  }
};

export const getMyTutories: Controller = async (req, res) => {
  const tutorId = req.tutor.id;

  try {
    const tutories = await tutoriesService.getTutories({
      tutorId: tutorId,
    });

    res.json({
      status: "success",
      data: tutories,
    });
  } catch (error) {
    logger.error(`Failed to get tutor services: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to get tutor services`,
    });
  }
};

type CreateTutorServiceSchema = z.infer<typeof createTutoriesSchema>;
export const createTutories: Controller<CreateTutorServiceSchema> = async (
  req,
  res,
) => {
  const tutorId = req.tutor.id;

  try {
    const data = await tutoriesService.createTutories(tutorId, req.body);

    res.status(201).json({
      status: "success",
      message: "Tutor service created successfully",
      data,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        status: "fail",
        message: error.message,
      });
      return;
    }

    logger.error(`Failed to create tutor service: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to create tutor service: ${error}`,
    });
  }
};

type UpdateTutorServiceSchema = z.infer<typeof updateTutoriesSchema>;
export const updateTutories: Controller<UpdateTutorServiceSchema> = async (
  req,
  res,
) => {
  const tutoriesId = req.params.tutoriesId;

  // Check if the tutor owns the tutories
  const isOwner = await tutoriesService.validateTutoriesOwnership({
    tutorId: req.tutor.id,
    tutoriesId,
  });

  if (!isOwner) {
    res.status(403).json({
      status: "error",
      message: "You are not authorized to update this tutor service",
    });
    return;
  }

  try {
    await tutoriesService.updateTutories(tutoriesId, req.body);

    res.status(200).json({
      status: "success",
      message: "Tutor service updated successfully",
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        status: "fail",
        message: error.message,
      });
      return;
    }

    logger.error(`Failed to update tutor service: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to update tutor service: ${error}`,
    });
  }
};

type DeleteTutorServiceSchema = z.infer<typeof deleteTutoriesSchema>;
export const deleteTutories: Controller<DeleteTutorServiceSchema> = async (
  req,
  res,
) => {
  const tutoriesId = req.params.tutoriesId;
  // Check if the tutor owns the tutories
  const isOwner = await tutoriesService.validateTutoriesOwnership({
    tutorId: req.tutor.id,
    tutoriesId,
  });

  if (!isOwner) {
    res.status(403).json({
      status: "error",
      message: "You are not authorized to delete this tutor service",
    });
    return;
  }

  try {
    await tutoriesService.deleteTutories(tutoriesId);

    res.json({
      status: "success",
      message: "Tutor service deleted successfully",
    });
  } catch (error) {
    logger.error(`Failed to delete tutor service: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to delete tutor service: ${error}`,
    });
  }
};

export const getRecommendations: Controller = async (req, res) => {
  const learnerId = req.learner.id;

  try {
    const recommendations = await tutoriesService.getRecommendations(learnerId);

    res.json({
      status: "success",
      data: recommendations,
    });
  } catch (error) {
    logger.error(`Failed to get recommendations: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to get recommendations`,
    });
  }
};

type TrackInteractionSchema = z.infer<typeof trackInteractionSchema>;
export const trackInteraction: Controller<TrackInteractionSchema> = async (
  req,
  res,
) => {
  const learnerId = req.learner.id;
  const tutoriesId = req.params.tutoriesId;

  try {
    await tutoriesService.trackInteraction(learnerId, tutoriesId);

    res.json({
      status: "success",
      message: "Interaction tracked successfully",
    });
  } catch (error) {
    logger.error(`Failed to track interaction: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to track interaction`,
    });
  }
};
