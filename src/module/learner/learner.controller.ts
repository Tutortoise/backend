import { bucket } from "@/config";
import { downscaleImage } from "@/helpers/image.helper";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import { changePasswordSchema } from "@/module/auth/auth.schema";
import { updateProfileSchema } from "@/module/learner/learner.schema";
import { LearnerService } from "@/module/learner/learner.service";
import { RequestHandler } from "express";
import { z } from "zod";
import { container } from "@/container";

const learnerService = new LearnerService({
  learnerRepository: container.learnerRepository,
  bucket,
  downscaleImage,
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
