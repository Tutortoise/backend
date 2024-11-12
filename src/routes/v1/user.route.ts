import { Router } from "express";
import * as userController from "@controllers/user.controller";
import {
  firebaseAuthMiddleware,
  verifyUser,
} from "../../middleware/auth.middleware";

// /api/v1/users
const userRouter = Router();
userRouter.use(firebaseAuthMiddleware);
userRouter.use(verifyUser);

userRouter.patch("/profile", userController.updateProfile);

export default userRouter;
