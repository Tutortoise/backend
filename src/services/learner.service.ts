import { Bucket } from "@google-cloud/storage";
import { logger } from "@middleware/logging.middleware";
import { updateProfileSchema } from "@schemas/learner.schema";
import firebase from "firebase-admin";
import { Firestore } from "firebase-admin/firestore";
import { Auth } from "firebase-admin/lib/auth/auth";
import { z } from "zod";

export interface LearnerServiceDependencies {
  auth: Auth;
  firestore: Firestore;
  bucket: Bucket;
  downscaleImage: (imageBuffer: Buffer) => Promise<Buffer>;
}

export class LearnerService {
  private auth: Auth;
  private firestore: Firestore;
  private bucket: Bucket;
  private downscaleImage: (imageBuffer: Buffer) => Promise<Buffer>;

  constructor({
    auth,
    firestore,
    bucket,
    downscaleImage,
  }: LearnerServiceDependencies) {
    this.auth = auth;
    this.firestore = firestore;
    this.bucket = bucket;
    this.downscaleImage = downscaleImage;
  }

  async updateLearnerProfile(
    userId: string,
    data: z.infer<typeof updateProfileSchema>["body"],
  ) {
    const { location, ...restOfData } = data;

    // Handle location separately if present
    const newData = location
      ? {
          ...restOfData,
          location: new firebase.firestore.GeoPoint(
            location.latitude,
            location.longitude,
          ),
        }
      : restOfData;

    try {
      await this.firestore
        .collection("learners")
        .doc(userId)
        .update({
          ...newData,
          updatedAt: new Date(),
        });
    } catch (error) {
      throw new Error(`Failed to update profile: ${error}`);
    }
  }

  async updateLearnerProfilePicture(file: Express.Multer.File, userId: string) {
    try {
      const name = `profile-pictures/${userId}.jpg`;

      const image = await this.downscaleImage(file.buffer);
      const bucketFile = this.bucket.file(name);
      await bucketFile.save(image, { public: true });

      return `https://storage.googleapis.com/${this.bucket.name}/${name}`;
    } catch (error) {
      logger.error(`Failed to upload profile picture: ${error}`);

      return undefined;
    }
  }

  async changePassword(userId: string, newPassword: string) {
    try {
      await this.auth.updateUser(userId, { password: newPassword });
    } catch (error) {
      throw new Error(`Failed to change password: ${error}`);
    }
  }

  async checkLearnerExists(learnerId: string) {
    const learnerSnapshot = await this.firestore
      .collection("learners")
      .doc(learnerId)
      .get();

    return learnerSnapshot.exists;
  }

  async validateInterests(interests: string[]) {
    try {
      const subjectsSnapshot = await this.firestore
        .collection("subjects")
        .get();
      const validSubjects = subjectsSnapshot.docs.map((doc) => doc.id);

      return interests.every((interest) => validSubjects.includes(interest));
    } catch (error) {
      logger.error(`Failed to validate interests: ${error}`);
      return false;
    }
  }
}
