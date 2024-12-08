import { bucket } from "@/config";
import { downscaleImage } from "@/helpers/image.helper";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import { changePasswordSchema } from "@/module/auth/auth.schema";
import {
  getAvailabilitySchema,
  updateProfileSchema,
} from "@/module/tutor/tutor.schema";
import { TutorService } from "@/module/tutor/tutor.service";
import { RequestHandler } from "express";
import { z } from "zod";
import { container } from "@/container";
import { ValidationError } from "./tutor.error";

const tutorService = new TutorService({
  tutorRepository: container.tutorRepository,
  downscaleImage,
  bucket,
  faceValidation: container.faceValidationService,
});

export const getProfile: Controller = async (req, res) => {
  try {
    const profile = await tutorService.getProfile(req.tutor.id);

    res.json({
      status: "success",
      data: profile,
    });
  } catch (error) {
    logger.error(`Failed to get tutor profile: ${error}`);

    res.status(500).json({
      status: "error",
      message: "Failed to get tutor profile",
    });
  }
};

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
    if (error instanceof ValidationError) {
      res.status(400).json({
        status: "fail",
        message: error.message,
      });
      return;
    }

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
    const userId = req.tutor.id;
    const { currentPassword, newPassword } = req.body;

    const hasPassword = !!(await tutorService.getPassword(userId));

    // Only verify current password if user already has one
    if (hasPassword) {
      const isPasswordCorrect = await tutorService.verifyPassword(
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

    await tutorService.changePassword(userId, newPassword);

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

type GetAvailabilitySchema = z.infer<typeof getAvailabilitySchema>;
export const getAvailability: Controller<GetAvailabilitySchema> = async (
  req,
  res,
) => {
  const tutorId = req.params.tutorId;

  try {
    const availability = await tutorService.getAvailability(tutorId);

    res.json({
      status: "success",
      data: availability,
    });
  } catch (error) {
    logger.error(`Failed to get tutor service availability: ${error}`);

    res.status(500).json({
      status: "error",
      message: `Failed to get tutor service availability`,
    });
  }
};
