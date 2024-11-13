import * as userController from "@controllers/user.controller";
import {
  firebaseAuthMiddleware,
  verifyUser,
} from "@middleware/auth.middleware";
import {
  validateProfilePictureUpload,
  validator,
} from "@middleware/validation.middleware";
import { updateProfileSchema } from "@schemas/user.schema";
import { Router } from "express";

// /api/v1/users
const userRouter = Router();
userRouter.use(firebaseAuthMiddleware);
userRouter.use(verifyUser);

userRouter.patch(
  "/profile",
  validator(updateProfileSchema),
  userController.updateProfile,
);

userRouter.put(
  "/profile/picture",
  validateProfilePictureUpload,
  userController.updateProfilePicture,
);

export default userRouter;
