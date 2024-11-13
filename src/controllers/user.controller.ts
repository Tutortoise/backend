import { z } from "zod";
import { userSchema } from "../schemas/user.schema";
import { Controller } from "../types";
import { firestore } from "../config";
import { logger } from "../middleware/logging.middleware";

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
