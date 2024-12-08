import { Bucket } from "@google-cloud/storage";
import { updateProfileSchema } from "@/module/tutor/tutor.schema";
import { z } from "zod";
import { TutorRepository } from "./tutor.repository";
import { AuthRepository } from "../auth/auth.repository";
import { hash } from "bcryptjs";
import { FaceValidationService } from "@/module/face-validation/face-validation.interface";
import { ValidationError } from "./tutor.error";

export interface TutorServiceDependencies {
  tutorRepository: TutorRepository;
  bucket: Bucket;
  downscaleImage: (imageBuffer: Buffer) => Promise<Buffer>;
  faceValidation: FaceValidationService;
}

export class TutorService {
  private tutorRepository: TutorRepository;
  private bucket: Bucket;
  private downscaleImage: (imageBuffer: Buffer) => Promise<Buffer>;
  private faceValidation: FaceValidationService;

  constructor({
    tutorRepository,
    bucket,
    downscaleImage,
    faceValidation,
  }: TutorServiceDependencies) {
    this.tutorRepository = tutorRepository;
    this.bucket = bucket;
    this.downscaleImage = downscaleImage;
    this.faceValidation = faceValidation;
  }

  async getProfile(tutorId: string) {
    try {
      return await this.tutorRepository.getTutorById(tutorId);
    } catch (error) {
      throw new Error(`Failed to get tutor profile: ${error}`);
    }
  }

  async updateProfile(
    userId: string,
    data: z.infer<typeof updateProfileSchema>["body"],
  ) {
    await this.tutorRepository.updateTutor(userId, data);
  }

  async updateProfilePicture(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    const name = `profile-pictures/${userId}.jpg`;

    try {
      const image = await this.downscaleImage(file.buffer);

      const valResult = await this.faceValidation.validateFace(file.buffer);
      if (!valResult.is_valid) {
        throw new ValidationError(
          valResult.message || "Face validation failed",
        );
      }
      const bucketFile = this.bucket.file(name);
      await bucketFile.save(image, { public: true });

      return bucketFile.publicUrl();
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to update profile picture: ${error}`);
    }
  }

  async getAvailability(tutorId: string) {
    try {
      return await this.tutorRepository.getAvailability(tutorId);
    } catch (error) {
      throw new Error(`Failed to get tutor availability: ${error}`);
    }
  }

  async getPassword(userId: string) {
    return await this.tutorRepository.getPassword(userId);
  }

  async verifyPassword(userId: string, password: string) {
    const user = await this.tutorRepository.getPassword(userId);

    if (!user.password || user.password === "") {
      return true;
    }

    const isPasswordMatch = await AuthRepository.comparePassword(
      password,
      user.password,
    );

    return isPasswordMatch;
  }

  async changePassword(userId: string, newPassword: string) {
    try {
      await this.tutorRepository.updateTutor(userId, {
        password: await hash(newPassword, AuthRepository.SALT_ROUNDS),
      });
    } catch (error) {
      throw new Error(`Failed to change password: ${error}`);
    }
  }

  async checkTutorExists(tutorId: string) {
    try {
      return await this.tutorRepository.checkTutorExists(tutorId);
    } catch (error) {
      throw new Error(`Failed to check tutor existence: ${error}`);
    }
  }

  async validateServices(services: string[]) {
    try {
      return await this.tutorRepository.validateServices(services);
    } catch (error) {
      throw new Error(`Failed to validate services: ${error}`);
    }
  }
}
