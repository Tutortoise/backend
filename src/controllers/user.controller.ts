import { Container } from "typedi";
import { UserService } from "@services/user.service";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import { updateProfileSchema } from "@schemas/user.schema";
import type { RequestHandler } from "express";
import { z } from "zod";

type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

const userService = Container.get(UserService);

export const updateProfile: Controller<UpdateProfileSchema> = async (
  req,
  res,
) => {
  try {
    await userService.updateProfile(req.user.id, req.body);

    res.json({
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
    const url = await userService.updateProfilePicture(req.user.id, req.file!);

    res.json({
      status: "success",
      message: "Profile picture updated successfully",
      data: { url },
    });
  } catch (error) {
    logger.error("Failed to update profile picture", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update profile picture",
    });
  }
};
