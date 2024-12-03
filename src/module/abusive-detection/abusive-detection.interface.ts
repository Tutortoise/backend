export interface AbusiveDetectionResponse {
  is_abusive: boolean;
  probability: number;
  confidence: number;
  matched_words: string[];
  early_detection: boolean;
}

export interface AbusiveDetectionService {
  validateText(text: string): Promise<AbusiveDetectionResponse>;
  checkHealth(): Promise<boolean>;
}
