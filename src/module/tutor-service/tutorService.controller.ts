// import * as tutorServiceService from "@services/tutorService.service"; // hell nah
import { firestore } from "@/config";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import {
  createTutorServiceSchema,
  deleteTutorServiceSchema,
  getServiceSchema,
  getServicesSchema,
  updateTutorServiceSchema,
} from "@/module/tutor-service/tutorService.schema";
import { TutorServiceService } from "@/module/tutor-service/tutorService.service";
import { z } from "zod";

const tutorServiceService = new TutorServiceService({ firestore });

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
    const services = await tutorServiceService.getTutorServices(filters);

    res.json({
      status: "success",
      data: services,
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
  const tutorServiceId = req.params.tutorServiceId;

  if (tutorServiceId === "me") {
    next();
    return;
  }

  try {
    const service =
      await tutorServiceService.getTutorServiceDetail(tutorServiceId);

    if (!service) {
      res.status(404).json({
        status: "error",
        message: "Tutor service not found",
      });
      return;
    }

    res.json({
      status: "success",
      data: service,
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
      await tutorServiceService.getTutorServiceAvailability(tutorServiceId);

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
    const services = await tutorServiceService.getTutorServices({
      tutorId,
    });

    res.json({
      status: "success",
      data: services,
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
    await tutorServiceService.createTutorService(tutorId, req.body);

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
  const tutorServiceId = req.params.tutorServiceId;

  // Check if the tutor owns the tutor service
  const isOwner = await tutorServiceService.validateTutorServiceOwnership(
    req.tutor.id,
    tutorServiceId,
  );

  if (!isOwner) {
    res.status(403).json({
      status: "error",
      message: "You are not authorized to update this tutor service",
    });
    return;
  }

  try {
    await tutorServiceService.updateTutorService(tutorServiceId, req.body);

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
  const tutorServiceId = req.params.tutorServiceId;

  // Check if the tutor owns the tutor service
  const isOwner = await tutorServiceService.validateTutorServiceOwnership(
    req.tutor.id,
    tutorServiceId,
  );

  if (!isOwner) {
    res.status(403).json({
      status: "error",
      message: "You are not authorized to delete this tutor service",
    });
    return;
  }

  try {
    await tutorServiceService.deleteTutorService(req.tutor.id, tutorServiceId);

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
