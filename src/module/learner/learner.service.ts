import { Bucket } from "@google-cloud/storage";
import { updateProfileSchema } from "@/module/learner/learner.schema";
import { z } from "zod";
import { LearnerRepository } from "./learner.repository";
import { hash } from "bcryptjs";
import { AuthRepository } from "../auth/auth.repository";

export interface LearnerServiceDependencies {
  learnerRepository: LearnerRepository;
  bucket: Bucket;
  downscaleImage: (imageBuffer: Buffer) => Promise<Buffer>;
}

export class LearnerService {
  private learnerRepository: LearnerRepository;
  private bucket: Bucket;
  private downscaleImage: (imageBuffer: Buffer) => Promise<Buffer>;

  constructor({
    learnerRepository,
    bucket,
    downscaleImage,
  }: LearnerServiceDependencies) {
    this.learnerRepository = learnerRepository;
    this.bucket = bucket;
    this.downscaleImage = downscaleImage;
  }

  async getProfile(learnerId: string) {
    try {
      return await this.learnerRepository.getLearnerById(learnerId);
    } catch (error) {
      throw new Error(`Failed to get learner profile: ${error}`);
    }
  }

  async updateLearnerProfile(
    userId: string,
    data: z.infer<typeof updateProfileSchema>["body"],
  ) {
    try {
      await this.learnerRepository.updateLearnerProfile(userId, data);
    } catch (error) {
      throw new Error(`Failed to update profile: ${error}`);
    }
  }

  async updateLearnerProfilePicture(file: Express.Multer.File, userId: string) {
    const name = `profile-pictures/${userId}.jpg`;

    try {
      const image = await this.downscaleImage(file.buffer);
      const bucketFile = this.bucket.file(name);
      await bucketFile.save(image, { public: true });

      return bucketFile.publicUrl();
    } catch (error) {
      throw new Error(`Failed to update profile picture: ${error}`);
    }
  }

  async getPassword(userId: string) {
    return await this.learnerRepository.getPassword(userId);
  }

  async verifyPassword(userId: string, password: string) {
    const user = await this.learnerRepository.getPassword(userId);

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
      await this.learnerRepository.updateLearnerProfile(userId, {
        password: await hash(newPassword, AuthRepository.SALT_ROUNDS),
      });
    } catch (error) {
      throw new Error(`Failed to change password: ${error}`);
    }
  }
}
