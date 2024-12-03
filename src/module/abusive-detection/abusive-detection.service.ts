import axios from "axios";
import {
  AbusiveDetectionResponse,
  AbusiveDetectionService,
} from "./abusive-detection.interface";
import { logger } from "@middleware/logging.middleware";

export class RemoteAbusiveDetectionService implements AbusiveDetectionService {
  constructor(private readonly baseUrl: string) {}

  async validateText(text: string): Promise<AbusiveDetectionResponse> {
    try {
      const response = await axios.post<AbusiveDetectionResponse>(
        `${this.baseUrl}/predict`,
        { text },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 5000,
        },
      );

      return response.data;
    } catch (error) {
      logger.error("Abusive text detection service error:", error);
      throw new Error("Abusive text detection service unavailable");
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

export class NoOpAbusiveDetectionService implements AbusiveDetectionService {
  async validateText(_text: string): Promise<AbusiveDetectionResponse> {
    return {
      is_abusive: false,
      probability: 0,
      confidence: 1,
      matched_words: [],
      early_detection: false,
    };
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }
}
