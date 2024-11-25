import {
  jwtAuthMiddleware,
  verifyLearner,
} from "@/module/auth/auth.middleware";
import { changePasswordSchema } from "@/module/auth/auth.schema";
import * as learnerController from "@/module/learner/learner.controller";
import { updateProfileSchema } from "@/module/learner/learner.schema";
import {
  validateProfilePictureUpload,
  validator,
} from "@middleware/validation.middleware";
import { Router } from "express";

// /api/v1/learners
const learnerRouter = Router();
learnerRouter.use(jwtAuthMiddleware);
learnerRouter.use(verifyLearner);

learnerRouter.patch(
  "/profile",
  // #swagger.tags = ['learners']
  validator(updateProfileSchema),
  learnerController.updateProfile,
);

learnerRouter.put(
  "/profile/picture",
  // #swagger.tags = ['learners']
  validateProfilePictureUpload,
  learnerController.updateProfilePicture,
);

learnerRouter.put(
  "/password",
  // #swagger.tags = ['learners']
  validator(changePasswordSchema),
  learnerController.changePassword,
);

export default learnerRouter;
