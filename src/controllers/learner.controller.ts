import { auth, firestore, GCS_BUCKET_NAME } from "@/config";
import { downscaleImage } from "@/helpers/image.helper";
import { Controller } from "@/types";
import { Storage } from "@google-cloud/storage";
import { logger } from "@middleware/logging.middleware";
import { changePasswordSchema } from "@schemas/auth.schema";
import { updateProfileSchema } from "@schemas/learner.schema";
import { LearnerService } from "@services/learner.service";
import { RequestHandler } from "express";
import { z } from "zod";

const learnerService = new LearnerService({
  auth,
  firestore,
  storage: new Storage(),
  GCS_BUCKET_NAME,
  downscaleImage: downscaleImage,
});

type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export const updateProfile: Controller<UpdateProfileSchema> = async (
  req,
  res,
) => {
  try {
    await learnerService.updateLearnerProfile(req.learner.id, req.body);

    res.status(200).json({
      status: "success",
      message: "Learner profile updated successfully",
    });
  } catch (error) {
    logger.debug(`Failed to update learner profile: ${error}`);

    res.status(500).json({
      status: "error",
      message: "Failed to update learner profile",
    });
  }
};

export const updateProfilePicture: RequestHandler = async (req, res) => {
  try {
    const url = await learnerService.updateLearnerProfilePicture(
      req.file!,
      req.learner.id,
    );

    res.json({
      status: "success",
      message: "Profile picture updated successfully",
      data: { url },
    });
  } catch (error) {
    logger.debug("Failed to upload profile picture", error);

    res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to upload profile picture",
    });
  }
};

type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export const changePassword: Controller<ChangePasswordSchema> = async (
  req,
  res,
) => {
  try {
    await learnerService.changePassword(req.learner.id, req.body.newPassword);

    res.json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    logger.error(`Failed to change password: ${error}`);

    res.status(500).json({
      status: "error",
      message: "Failed to change password",
    });
  }
};
