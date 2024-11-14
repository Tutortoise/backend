import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import { updateProfileSchema } from "@schemas/user.schema";
import { changePasswordSchema } from "@schemas/auth.schema";
import * as userService from "@services/user.service";
import { RequestHandler } from "express";
import { z } from "zod";

type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export const updateProfile: Controller<UpdateProfileSchema> = async (
  req,
  res,
) => {
  try {
    await userService.updateUserProfile(req.user.id, req.body);

    res.status(200).json({
      status: "success",
      message: "User profile updated successfully",
    });
  } catch (error) {
    logger.debug("Failed to update profile", error);

    res.status(500).json({
      status: "error",
      message: "Failed to update profile",
    });
  }
};

export const updateProfilePicture: RequestHandler = async (req, res) => {
  try {
    const url = await userService.updateUserProfilePicture(
      req.file!,
      req.user.id,
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
    await userService.changePassword(req.user.id, req.body.newPassword);

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
