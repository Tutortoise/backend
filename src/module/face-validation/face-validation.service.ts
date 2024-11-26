import axios from "axios";
import {
  FaceValidationService,
  FaceValidationResponse,
} from "./face-validation.interface";
import { logger } from "@middleware/logging.middleware";

export class RemoteFaceValidationService implements FaceValidationService {
  constructor(private readonly baseUrl: string) {}

  async validateFace(imageBuffer: Buffer): Promise<FaceValidationResponse> {
    try {
      const imageBase64 = imageBuffer.toString("base64");
      const response = await axios.post<{
        is_valid: boolean;
        face_count: number;
        message: string;
      }>(
        `${this.baseUrl}/validate-face`,
        { image: imageBase64 },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 5000,
        },
      );

      return {
        is_valid: response.data.is_valid,
        face_count: response.data.face_count,
        message: response.data.message,
      };
    } catch (error) {
      logger.error("Face validation service error:", error);
      throw new Error("Face validation service unavailable");
    }
  }

  checkHealthSync(): boolean {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", `${this.baseUrl}/health`, false); // Make the request synchronous
      xhr.timeout = 5000;
      xhr.send(null);

      return xhr.status === 200;
    } catch (error) {
      logger.warn("Health check failed:", error);
      return false;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
      });
      return response.data.status === "healthy";
    } catch (error) {
      return false;
    }
  }
}

export class NoOpFaceValidationService implements FaceValidationService {
  async validateFace(_imageBuffer: Buffer): Promise<FaceValidationResponse> {
    return {
      is_valid: true,
      face_count: 0,
      message: "Face validation is not enabled",
    };
  }

  checkHealthSync(): boolean {
    return true;
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }
}
