import { Router } from "express";
import * as authController from "@controllers/auth.controller";
import { validator } from "../../middleware/validation.middleware";
import { registerSchema } from "../../schemas/auth.schema";

// /api/v1/auth
const authRouter = Router();

authRouter.get("/", authController.helloAuth);

authRouter.post(
  "/register",
  validator(registerSchema),
  authController.register,
);

export default authRouter;
