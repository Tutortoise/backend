import * as learnerController from "@/module/learner/learner.controller";
import {
  firebaseAuthMiddleware,
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
learnerRouter.use(firebaseAuthMiddleware);
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

// TODO: harus validasi dulu password lamanya. Di firebase-admin ga ada kayak compare password
//       jadi harus di handle di client atau generate password reset link yang dikirim di email
learnerRouter.put(
  "/password",
  validator(changePasswordSchema),
  learnerController.changePassword,
);

export default learnerRouter;
