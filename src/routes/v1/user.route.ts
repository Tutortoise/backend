import { Router } from "express";
import * as userController from "@controllers/user.controller";
import {
  firebaseAuthMiddleware,
  verifyUser,
} from "../../middleware/auth.middleware";
import { validator } from "../../middleware/validation.middleware";
import { userSchema } from "../../schemas/user.schema";

// /api/v1/users
const userRouter = Router();
userRouter.use(firebaseAuthMiddleware);
userRouter.use(verifyUser);

userRouter.patch(
  "/profile",
  validator(userSchema),
  userController.updateProfile,
);

export default userRouter;
