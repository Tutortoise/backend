import * as subjectController from "@/module/subject/subject.controller";
import { Router } from "express";
import { jwtAuthMiddleware, verifyTutor } from "../auth/auth.middleware";

// /api/v1/subjects
const subjectRouter = Router();

subjectRouter.get(
  "/",
  // #swagger.tags = ['subjects']
  subjectController.getAllSubjects,
);

subjectRouter.get(
  "/popular",
  // #swagger.tags = ['subjects']
  // #swagger.description = 'Get subjects sorted by number of available tutories'
  subjectController.getPopularSubjects,
);

subjectRouter.get(
  "/available",
  // #swagger.tags = ['subjects']
  // #swagger.description = 'Get subjects that are available for selection, excluding subjects that are already selected by the tutor'
  jwtAuthMiddleware,
  verifyTutor,
  subjectController.getAvailableSubjects,
);

export default subjectRouter;
