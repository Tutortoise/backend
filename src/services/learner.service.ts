import { auth, GCS_BUCKET_NAME } from "@/config";
import { learnersCollection, subjectCollection } from "@/config/db";
import { downscaleImage } from "@/helpers/image.helper";
import { Storage } from "@google-cloud/storage";
import { logger } from "@middleware/logging.middleware";
import { updateProfileSchema } from "@schemas/learner.schema";
import firebase from "firebase-admin";
import { z } from "zod";

const storage = new Storage();

export const updateLearnerProfile = async (
  userId: string,
  data: z.infer<typeof updateProfileSchema>["body"],
) => {
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
    await learnersCollection.doc(userId).update({
      ...newData,
      updatedAt: new Date(),
    });
  } catch (error) {
    throw new Error(`Failed to update profile: ${error}`);
  }
};

// Upload to: profile-pictures/{uid}.jpg
export const updateLearnerProfilePicture = async (
  file: Express.Multer.File,
  userId: string,
) => {
  try {
    const image = await downscaleImage(file.buffer);
    const bucket = storage.bucket(GCS_BUCKET_NAME);
    const bucketFile = bucket.file(`profile-pictures/${userId}.jpg`);

    await bucketFile.save(image, { public: true });

    return `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${bucketFile.name}`;
  } catch (error) {
    logger.error(`Failed to upload profile picture: ${error}`);

    return undefined;
  }
};

export const changePassword = async (userId: string, newPassword: string) => {
  try {
    await auth.updateUser(userId, {
      password: newPassword,
    });
  } catch (error) {
    throw new Error(`Failed to change password: ${error}`);
  }
};

export const validateInterests = async (interests: string[]) => {
  try {
    const subjectsSnapshot = await subjectCollection.get();
    const validSubjects = subjectsSnapshot.docs.map((doc) => doc.id);

    return interests.every((interest) => validSubjects.includes(interest));
  } catch (error) {
    logger.error(`Failed to validate interests: ${error}`);

    return false;
  }
};
