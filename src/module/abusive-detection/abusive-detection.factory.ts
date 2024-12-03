import { ABUSIVE_DETECTION_ENABLED, ABUSIVE_DETECTION_URL } from "@/config";
import {
  RemoteAbusiveDetectionService,
  NoOpAbusiveDetectionService,
} from "./abusive-detection.service";
import { logger } from "@middleware/logging.middleware";
import axios from "axios";

export const createAbusiveDetectionService = () => {
  if (process.env.NODE_ENV === "test" || !ABUSIVE_DETECTION_ENABLED) {
    logger.info("Abusive text detection is disabled, using NoOp service");
    return new NoOpAbusiveDetectionService();
  }

  const service = new RemoteAbusiveDetectionService(ABUSIVE_DETECTION_URL!);

  try {
    axios
      .get(`${ABUSIVE_DETECTION_URL}/health`, {
        timeout: 5000,
      })
      .catch(() => {
        throw new Error("Health check failed");
      });

    logger.info("Abusive text detection service is healthy and ready");
    return service;
  } catch (error) {
    logger.warn(
      `Abusive text detection service is unavailable: ${error}, falling back to NoOp service`,
    );
    return new NoOpAbusiveDetectionService();
  }
};
