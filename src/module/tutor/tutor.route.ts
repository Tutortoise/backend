import { jwtAuthMiddleware, verifyTutor } from "@/module/auth/auth.middleware";
import { changePasswordSchema } from "@/module/auth/auth.schema";
import * as tutorController from "@/module/tutor/tutor.controller";
import {
  getAvailabilitySchema,
  updateProfileSchema,
} from "@/module/tutor/tutor.schema";
import {
  validateProfilePictureUpload,
  validator,
} from "@middleware/validation.middleware";
import { Router } from "express";

// /api/v1/tutors
const tutorRouter = Router();
tutorRouter.use(jwtAuthMiddleware);

tutorRouter.get(
  "/:tutorId/availability",
  // #swagger.tags = ['tutors']
  validator(getAvailabilitySchema),
  tutorController.getAvailability,
);

tutorRouter.use(verifyTutor);

tutorRouter.get(
  "/profile",
  // #swagger.tags = ['tutors']
  tutorController.getProfile,
);

tutorRouter.patch(
  "/profile",
  // #swagger.tags = ['tutors']
  /* #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/UpdateTutorProfileSchema" }
  } */
  validator(updateProfileSchema),
  tutorController.updateProfile,
);

tutorRouter.put(
  "/profile/picture",
  /* #swagger.tags = ['tutors']
  #swagger.requestBody = {
    required: true,
    content: {
      'image/jpg': {
        schema: {  type: 'string', format: 'binary' }
      }
    }
  } */
  validateProfilePictureUpload,
  tutorController.updateProfilePicture,
);

tutorRouter.put(
  "/password",
  /* #swagger.tags = ['tutors']
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/ChangePasswordSchema" }
  } */
  validator(changePasswordSchema),
  tutorController.changePassword,
);

export default tutorRouter;
