import { Service } from "typedi";
import { BaseService } from "./base.service";
import { GCS_BUCKET_NAME } from "@/config";
import { Storage } from "@google-cloud/storage";
import { logger } from "@middleware/logging.middleware";
import firebase from "firebase-admin";
import sharp from "sharp";
import type { UpdateProfileBody } from "@/types";

@Service()
export class UserService extends BaseService {
  private storage = new Storage();

  async updateProfile(userId: string, data: UpdateProfileBody) {
    const { location, ...restOfData } = data;

    const newData = location
      ? {
          ...restOfData,
          location: new firebase.firestore.GeoPoint(
            location.latitude,
            location.longitude,
          ),
        }
      : restOfData;

    await this.collection("users")
      .doc(userId)
      .update({
        ...newData,
        updatedAt: new Date(),
      });
  }

  async updateProfilePicture(userId: string, file: Express.Multer.File) {
    try {
      const url = await this.uploadImage(file, userId);
      if (!url) {
        throw new Error("Failed to upload image");
      }

      await this.collection("users").doc(userId).update({
        profilePicture: url,
        updatedAt: new Date(),
      });

      return url;
    } catch (error) {
      logger.error(`Failed to update profile picture: ${error}`);
      throw error;
    }
  }

  private async uploadImage(file: Express.Multer.File, uid: string) {
    try {
      const image = await this.downscaleImage(file.buffer);

      const bucket = this.storage.bucket(GCS_BUCKET_NAME);
      const bucketFile = bucket.file(`profile-pictures/${uid}.jpg`);
      await bucketFile.save(image, { public: true });

      return `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${bucketFile.name}`;
    } catch (error) {
      logger.error(`Failed to upload image: ${error}`);
      return undefined;
    }
  }

  private async downscaleImage(buffer: Buffer) {
    return sharp(buffer).resize(1024, 1024).jpeg({ quality: 80 }).toBuffer();
  }
}
