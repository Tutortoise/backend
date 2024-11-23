import * as learnerController from "@/module/learner/learner.controller";
import {
  jwtAuthMiddleware,
  verifyLearner,
} from "@/module/auth/auth.middleware";
import {
  validateProfilePictureUpload,
  validator,
} from "@middleware/validation.middleware";
import { changePasswordSchema } from "@/module/auth/auth.schema";
import { updateProfileSchema } from "@/module/learner/learner.schema";
import { Router } from "express";

// /api/v1/learners
const learnerRouter = Router();
learnerRouter.use(jwtAuthMiddleware);
learnerRouter.use(verifyLearner);

learnerRouter.patch(
  "/profile",
  validator(updateProfileSchema),
  learnerController.updateProfile,
);

learnerRouter.put(
  "/profile/picture",
  validateProfilePictureUpload,
  learnerController.updateProfilePicture,
);

learnerRouter.put(
  "/password",
  validator(changePasswordSchema),
  learnerController.changePassword,
);

export default learnerRouter;
