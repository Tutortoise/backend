import { firestore } from "@/config";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import { userSchema } from "@schemas/user.schema";
import { uploadProfilePicture } from "@services/upload.service";
import type { RequestHandler } from "express";
import { z } from "zod";

type UpdateProfileSchema = z.infer<typeof userSchema>;
export const updateProfile: Controller<UpdateProfileSchema> = async (
  req,
  res,
) => {
  try {
    firestore
      .collection("users")
      .doc(req.user.id)
      .update({
        ...req.body,
        updatedAt: new Date(),
      });
  } catch (error) {
    logger.debug("Failed to update profile", error);

    res
      .status(500)
      .json({ status: "error", message: "Failed to update profile" });
    return;
  }

  res
    .status(200)
    .json({ status: "success", message: "User profile updated successfully" });
};

export const updateProfilePicture: RequestHandler = async (req, res) => {
  const url = await uploadProfilePicture(req.file!, req.user.id);

  if (!url) {
    res.status(500).json({
      status: "error",
      message: "Failed to upload profile picture",
    });
    return;
  }

  res.json({
    status: "success",
    message: "Profile picture updated successfully",
    data: {
      url,
    },
  });
};
