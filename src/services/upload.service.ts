import { Storage } from "@google-cloud/storage";
import { GCS_BUCKET_NAME } from "../config";
import sharp from "sharp";
import { logger } from "../middleware/logging.middleware";

const storage = new Storage();

// Downscale image to 1024x1024 and convert to JPEG
const downscaleImage = async (buffer: Buffer) => {
  return sharp(buffer).resize(1024, 1024).jpeg({ quality: 80 }).toBuffer();
};

// Upload to: profile-pictures/{uid}.jpg
export const uploadProfilePicture = async (
  file: Express.Multer.File,
  uid: string,
) => {
  try {
    const image = await downscaleImage(file.buffer);

    const bucket = storage.bucket(GCS_BUCKET_NAME);
    const bucketFile = bucket.file(`profile-pictures/${uid}.jpg`);
    await bucketFile.save(image, { public: true });

    return `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${bucketFile.name}`;
  } catch (error) {
    logger.error(`Failed to upload profile picture: ${error}`);

    return undefined;
  }
};
