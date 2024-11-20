import { auth, bucket, firestore } from "@/config";
import { downscaleImage } from "@/helpers/image.helper";
import { getCityName } from "@/helpers/location.helper";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import { changePasswordSchema } from "@schemas/auth.schema";
import { updateProfileSchema } from "@schemas/tutor.schema";
import { TutorService } from "@services/tutor.service";
import { RequestHandler } from "express";
import { z } from "zod";

const tutorService = new TutorService({
  auth,
  firestore,
  downscaleImage,
  bucket,
  getCityName,
});

type UpdateTutorProfileSchema = z.infer<typeof updateProfileSchema>;
export const updateProfile: Controller<UpdateTutorProfileSchema> = async (
  req,
  res,
) => {
  try {
    await tutorService.updateProfile(req.tutor.id, req.body);

    res.status(200).json({
      status: "success",
      message: "Tutor profile updated successfully",
    });
  } catch (error) {
    logger.debug(`Failed to update tutor profile: ${error}`);

    res.status(500).json({
      status: "error",
      message: "Failed to update tutor profile",
    });
  }
};

export const updateProfilePicture: RequestHandler = async (req, res) => {
  try {
    const url = await tutorService.updateProfilePicture(
      req.file!,
      req.tutor.id,
    );

    res.json({
      status: "success",
      message: "Profile picture updated successfully",
      data: { url },
    });
  } catch (error) {
    logger.error(`Failed to upload profile picture: ${error}`);

    res.status(500).json({
      status: "error",
      message: "Failed to upload profile picture",
    });
  }
};

type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export const changePassword: Controller<ChangePasswordSchema> = async (
  req,
  res,
) => {
  try {
    await tutorService.changePassword(req.tutor.id, req.body.newPassword);

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
