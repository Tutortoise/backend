import { container } from "@/container";
import {
  createTutorServiceSchema,
  deleteTutorServiceSchema,
  getServiceSchema,
  getServicesSchema,
  updateTutorServiceSchema,
} from "@/module/tutories/tutories.schema";
import { TutoriesService } from "@/module/tutories/tutories.service";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import { z } from "zod";

const tutoriesService = new TutoriesService({
  tutoriesRepository: container.tutoriesRepository,
});

type GetServicesSchema = z.infer<typeof getServicesSchema>;
export const getServices: Controller<GetServicesSchema> = async (req, res) => {
  const { q, subjectId, minHourlyRate, maxHourlyRate, typeLesson, city } =
    req.query;

  const filters = {
    q: q || null,
    subjectId: subjectId || null,
    minHourlyRate: minHourlyRate ? parseInt(minHourlyRate as string) : null,
    maxHourlyRate: maxHourlyRate ? parseInt(maxHourlyRate as string) : null,
    typeLesson: typeLesson || null,
    // minRating: minRating ? parseFloat(minRating as string) : null,
    city: city || null,
  };

  try {
    const tutories = await tutoriesService.getTutories({
      q: filters.q,
      subjectId: filters.subjectId,
      minHourlyRate: filters.minHourlyRate,
      maxHourlyRate: filters.maxHourlyRate,
      typeLesson: filters.typeLesson,
      // minRating: filters.minRating,
      city: filters.city,
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

type GetServiceSchema = z.infer<typeof getServiceSchema>;
export const getService: Controller<GetServiceSchema> = async (
  req,
  res,
  next,
) => {
  const tutoriesId = req.params.tutorServiceId;

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

export const getServiceAvailability: Controller<GetServiceSchema> = async (
  req,
  res,
) => {
  const tutorServiceId = req.params.tutorServiceId;

  try {
    const availability =
      await tutoriesService.getTutoriesAvailability(tutorServiceId);

    res.json({
      status: "success",
      data: availability,
    });
  } catch (error) {
    logger.error(`Failed to get tutor service availability: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to get tutor service availability`,
    });
  }
};

export const getMyServices: Controller = async (req, res) => {
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

type CreateTutorServiceSchema = z.infer<typeof createTutorServiceSchema>;
export const createService: Controller<CreateTutorServiceSchema> = async (
  req,
  res,
) => {
  const tutorId = req.tutor.id;

  try {
    await tutoriesService.createTutorService(tutorId, req.body);

    res.status(201).json({
      status: "success",
      message: "Tutor service created successfully",
    });
  } catch (error) {
    logger.error(`Failed to create tutor service: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to create tutor service: ${error}`,
    });
  }
};

type UpdateTutorServiceSchema = z.infer<typeof updateTutorServiceSchema>;
export const updateService: Controller<UpdateTutorServiceSchema> = async (
  req,
  res,
) => {
  const tutoriesId = req.params.tutoriesId;

  // Check if the tutor owns the tutor service
  const isOwner = await tutoriesService.validateTutoriesOwnership(
    req.tutor.id,
    tutoriesId,
  );

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
    logger.error(`Failed to update tutor service: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to update tutor service: ${error}`,
    });
  }
};

type DeleteTutorServiceSchema = z.infer<typeof deleteTutorServiceSchema>;
export const deleteService: Controller<DeleteTutorServiceSchema> = async (
  req,
  res,
) => {
  const tutoriesId = req.params.tutorServiceId;
  // Check if the tutor owns the tutories
  const isOwner = await tutoriesService.validateTutoriesOwnership(
    req.tutor.id,
    tutoriesId,
  );

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
