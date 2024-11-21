import * as tutorController from "@/module/tutor/tutor.controller";
import {
  firebaseAuthMiddleware,
  verifyTutor,
} from "@/module/auth/auth.middleware";
import {
  validateProfilePictureUpload,
  validator,
} from "@middleware/validation.middleware";
import { changePasswordSchema } from "@/module/auth/auth.schema";
import { updateProfileSchema } from "@/module/tutor/tutor.schema";
import { Router } from "express";

// /api/v1/tutors
const tutorRouter = Router();
tutorRouter.use(firebaseAuthMiddleware);
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

// TODO: harus validasi dulu password lamanya. Di firebase-admin ga ada kayak compare password
//       jadi harus di handle di client atau generate password reset link yang dikirim di email
tutorRouter.put(
  "/password",
  validator(changePasswordSchema),
  tutorController.changePassword,
);

export default tutorRouter;
