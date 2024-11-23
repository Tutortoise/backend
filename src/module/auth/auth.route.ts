import { Router } from "express";
import * as authController from "@/module/auth/auth.controller";
import { validator } from "@middleware/validation.middleware";
import { loginSchema, registerSchema } from "@/module/auth/auth.schema";
import { fcmTokenSchema } from "@/module/auth/auth.schema";
import { firebaseAuthMiddleware, jwtAuthMiddleware } from "./auth.middleware";

// /api/v1/auth
const authRouter = Router();

authRouter.post(
  "/register",
  validator(registerSchema),
  authController.register,
);

authRouter.post("/login", validator(loginSchema), authController.login);

authRouter.post(
  "/fcm-token",
  jwtAuthMiddleware,
  validator(fcmTokenSchema),
  authController.updateFCMToken,
);

authRouter.delete(
  "/fcm-token",
  jwtAuthMiddleware,
  validator(fcmTokenSchema),
  authController.removeFCMToken,
);

export default authRouter;
