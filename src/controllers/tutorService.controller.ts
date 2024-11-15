// import * as tutorServiceService from "@services/tutorService.service"; // hell nah
import { createTutorService } from "@services/tutorService.service";
import { Controller } from "@/types";
import { createTutorServiceSchema } from "@schemas/tutorService.schema";
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
