import * as tutorController from "@/module/tutor/tutor.controller";
import { jwtAuthMiddleware, verifyTutor } from "@/module/auth/auth.middleware";
import {
  validateProfilePictureUpload,
  validator,
} from "@middleware/validation.middleware";
import { changePasswordSchema } from "@/module/auth/auth.schema";
import { updateProfileSchema } from "@/module/tutor/tutor.schema";
import { Router } from "express";

// /api/v1/tutors
const tutorRouter = Router();
tutorRouter.use(jwtAuthMiddleware);
tutorRouter.use(verifyTutor);

tutorRouter.patch(
  "/profile",
  validator(updateProfileSchema),
  tutorController.updateProfile,
);

tutorRouter.put(
  "/profile/picture",
  validateProfilePictureUpload,
  tutorController.updateProfilePicture,
);

tutorRouter.put(
  "/password",
  validator(changePasswordSchema),
  tutorController.changePassword,
);

export default tutorRouter;
