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

export const getProfile: Controller = async (req, res) => {
  try {
    const learner = await learnerService.getProfile(req.learner.id);

    res.json({
      status: "success",
      data: learner,
    });
  } catch (error) {
    logger.error(`Failed to get learner profile: ${error}`);

    res.status(500).json({
      status: "error",
      message: "Failed to get learner profile",
    });
  }
};

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
    const userId = req.learner.id;
    const { currentPassword, newPassword } = req.body;

    const hasPassword = !!(await learnerService.getPassword(userId));

    // Only verify current password if user already has one
    if (hasPassword) {
      const isPasswordCorrect = await learnerService.verifyPassword(
        userId,
        currentPassword ?? "",
      );

      if (!isPasswordCorrect) {
        res.status(400).json({
          status: "fail",
          message: "Current password is incorrect",
        });
        return;
      }
    }

    await learnerService.changePassword(userId, newPassword);

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
