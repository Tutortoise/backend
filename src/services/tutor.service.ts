import { Bucket } from "@google-cloud/storage";
import { logger } from "@middleware/logging.middleware";
import { updateProfileSchema } from "@schemas/tutor.schema";
import firebase from "firebase-admin";
import { Firestore } from "firebase-admin/firestore";
import { Auth } from "firebase-admin/lib/auth/auth";
import { z } from "zod";

export interface TutorServiceDependencies {
  auth: Auth;
  firestore: Firestore;
  bucket: Bucket;
  getCityName: (location: {
    latitude: number;
    longitude: number;
  }) => Promise<string>;
  downscaleImage: (imageBuffer: Buffer) => Promise<Buffer>;
}

export class TutorService {
  private auth: Auth;
  private firestore: Firestore;
  private bucket: Bucket;
  private downscaleImage: (imageBuffer: Buffer) => Promise<Buffer>;
  private getCityName: (location: {
    latitude: number;
    longitude: number;
  }) => Promise<string>;

  constructor({
    auth,
    firestore,
    bucket,
    downscaleImage,
    getCityName,
  }: TutorServiceDependencies) {
    this.auth = auth;
    this.firestore = firestore;
    this.bucket = bucket;
    this.downscaleImage = downscaleImage;
    this.getCityName = getCityName;
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
          city: await this.getCityName(location),
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
    const name = `profile-pictures/${userId}.jpg`;

    const image = await this.downscaleImage(file.buffer);
    const bucketFile = this.bucket.file(name);
    await bucketFile.save(image, { public: true });

    return bucketFile.publicUrl();
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
