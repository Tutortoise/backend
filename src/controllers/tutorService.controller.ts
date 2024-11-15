// import * as tutorServiceService from "@services/tutorService.service"; // hell nah
import {
  createTutorService,
  updateTutorService,
} from "@services/tutorService.service";
import { Controller } from "@/types";
import {
  createTutorServiceSchema,
  updateTutorServiceSchema,
} from "@schemas/tutorService.schema";
import { z } from "zod";
import { logger } from "@middleware/logging.middleware";

type CreateTutorServiceSchema = z.infer<typeof createTutorServiceSchema>;
export const createService: Controller<CreateTutorServiceSchema> = async (
  req,
  res,
) => {
  const tutorId = req.tutor.id;

  try {
    await createTutorService(tutorId, req.body);

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

  try {
    await updateTutorService(tutorServiceId, req.body);

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
