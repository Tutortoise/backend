import { FACE_VALIDATION_ENABLED, FACE_VALIDATION_URL } from "@/config";
import {
  RemoteFaceValidationService,
  NoOpFaceValidationService,
} from "./face-validation.service";
import { logger } from "@middleware/logging.middleware";
import axios from "axios";

export const createFaceValidationService = () => {
  if (process.env.NODE_ENV === "test" || !FACE_VALIDATION_ENABLED) {
    logger.info("Face validation is disabled, using NoOp service");
    return new NoOpFaceValidationService();
  }

  const service = new RemoteFaceValidationService(FACE_VALIDATION_URL!);

  try {
    axios
      .get(`${FACE_VALIDATION_URL}/health`, {
        timeout: 5000,
      })
      .catch(() => {
        throw new Error("Health check failed");
      });

    logger.info("Face validation service is healthy and ready");
    return service;
  } catch (error) {
    logger.warn(
      `Face validation service is unavailable: ${error}, falling back to NoOp service`,
    );
    return new NoOpFaceValidationService();
  }
};
