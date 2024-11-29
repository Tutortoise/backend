import * as authController from "@/module/auth/auth.controller";
import {
  fcmTokenSchema,
  loginSchema,
  oAuthSchema,
  registerSchema,
} from "@/module/auth/auth.schema";
import { validator } from "@middleware/validation.middleware";
import { Router } from "express";
import { jwtAuthMiddleware } from "./auth.middleware";

// /api/v1/auth
const authRouter = Router();

authRouter.get(
  "/me",
  // #swagger.tags = ['auth']
  jwtAuthMiddleware,
  authController.getUser,
);

authRouter.post(
  "/register",
  /* #swagger.tags = ['auth']
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/RegisterSchema" }
  } */
  validator(registerSchema),
  authController.register,
);

authRouter.post(
  "/login",
  /* #swagger.tags = ['auth']
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/LoginSchema" }
  } */
  validator(loginSchema),
  authController.login,
);

authRouter.post(
  "/google",
  /* #swagger.tags = ['auth']
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/OAuthSchema" }
  } */
  validator(oAuthSchema),
  authController.googleAuth,
);

authRouter.post(
  "/fcm-token",
  /* #swagger.tags = ['auth']
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/FCMTokenSchema" }
  } */
  jwtAuthMiddleware,
  validator(fcmTokenSchema),
  authController.updateFCMToken,
);

authRouter.delete(
  "/fcm-token",
  // #swagger.tags = ['auth']
  jwtAuthMiddleware,
  validator(fcmTokenSchema),
  authController.removeFCMToken,
);

export default authRouter;
