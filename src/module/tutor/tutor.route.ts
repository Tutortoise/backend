import { jwtAuthMiddleware, verifyTutor } from "@/module/auth/auth.middleware";
import { changePasswordSchema } from "@/module/auth/auth.schema";
import * as tutorController from "@/module/tutor/tutor.controller";
import { updateProfileSchema } from "@/module/tutor/tutor.schema";
import {
  validateProfilePictureUpload,
  validator,
} from "@middleware/validation.middleware";
import { Router } from "express";

// /api/v1/tutors
const tutorRouter = Router();
tutorRouter.use(jwtAuthMiddleware);
tutorRouter.use(verifyTutor);

tutorRouter.patch(
  "/profile",
  // #swagger.tags = ['tutors']
  validator(updateProfileSchema),
  tutorController.updateProfile,
);

tutorRouter.put(
  "/profile/picture",
  // #swagger.tags = ['tutors']
  validateProfilePictureUpload,
  tutorController.updateProfilePicture,
);

tutorRouter.put(
  "/password",
  // #swagger.tags = ['tutors']
  validator(changePasswordSchema),
  tutorController.changePassword,
);

export default tutorRouter;
