export interface FaceValidationResponse {
  is_valid: boolean;
  face_count: number;
  message: string;
}

export interface FaceValidationService {
  validateFace(imageBuffer: Buffer): Promise<FaceValidationResponse>;
  checkHealth(): Promise<boolean>;
}
