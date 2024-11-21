import { Router } from "express";
import * as authController from "@/module/auth/auth.controller";
import { validator } from "@middleware/validation.middleware";
import { registerSchema } from "@/module/auth/auth.schema";

// /api/v1/auth
const authRouter = Router();

authRouter.post(
  "/register",
  validator(registerSchema),
  authController.register,
);

export default authRouter;
