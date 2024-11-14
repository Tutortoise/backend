import * as userController from "@controllers/user.controller";
import {
  firebaseAuthMiddleware,
  verifyUser,
} from "@middleware/auth.middleware";
import {
  validateProfilePictureUpload,
  validator,
} from "@middleware/validation.middleware";
import { changePasswordSchema } from "@schemas/auth.schema";
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

// TODO: harus validasi dulu password lamanya. Di firebase-admin ga ada kayak compare password
//       jadi harus di handle di client atau generate password reset link yang dikirim di email
userRouter.put(
  "/password",
  validator(changePasswordSchema),
  userController.changePassword,
);

export default userRouter;
