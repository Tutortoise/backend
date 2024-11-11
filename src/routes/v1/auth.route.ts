import { Router } from "express";
import * as authController from "@controllers/auth.controller";

// /api/v1/auth
const authRouter = Router();

authRouter.get("/", authController.helloAuth);

export default authRouter;
