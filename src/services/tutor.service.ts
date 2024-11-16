import { Storage } from "@google-cloud/storage";
import { logger } from "@middleware/logging.middleware";
import { updateProfileSchema } from "@schemas/tutor.schema";
import firebase from "firebase-admin";
import { Firestore } from "firebase-admin/firestore";
import { Auth } from "firebase-admin/lib/auth/auth";
import { z } from "zod";

export interface TutorServiceDependencies {
  auth: Auth;
  firestore: Firestore;
  storage: Storage;
  GCS_BUCKET_NAME: string;
  downscaleImage: (imageBuffer: Buffer) => Promise<Buffer>;
}

export class TutorService {
  private auth: Auth;
  private firestore: Firestore;
  private storage: Storage;
  private GCS_BUCKET_NAME: string;
  private downscaleImage: (imageBuffer: Buffer) => Promise<Buffer>;

  constructor({
    auth,
    firestore,
    storage,
    GCS_BUCKET_NAME,
    downscaleImage,
  }: TutorServiceDependencies) {
    this.auth = auth;
    this.firestore = firestore;
    this.storage = storage;
    this.GCS_BUCKET_NAME = GCS_BUCKET_NAME;
    this.downscaleImage = downscaleImage;
  }

  async updateProfile(
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
        .collection("tutors")
        .doc(userId)
        .update({
          ...newData,
          updatedAt: new Date(),
        });
    } catch (error) {
      throw new Error(`Failed to update profile: ${error}`);
    }
  }

  async updateProfilePicture(file: Express.Multer.File, userId: string) {
    try {
      const name = `profile-pictures/${userId}.jpg`;

      const image = await this.downscaleImage(file.buffer);
      const bucket = this.storage.bucket(this.GCS_BUCKET_NAME);
      const bucketFile = bucket.file(name);
      await bucketFile.save(image, { public: true });

      return `https://storage.googleapis.com/${this.GCS_BUCKET_NAME}/${name}`;
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

  async checkTutorExists(tutorId: string) {
    const tutorSnapshot = await this.firestore
      .collection("tutors")
      .doc(tutorId)
      .get();

    return tutorSnapshot.exists;
  }

  async validateServices(services: string[]) {
    try {
      const servicesSnapshot = await this.firestore
        .collection("tutor_services")
        .get();
      const validServices = servicesSnapshot.docs.map((doc) => doc.id);

      return services.every((service) => validServices.includes(service));
    } catch (error) {
      logger.error(`Failed to validate services: ${error}`);
      return false;
    }
  }
}
