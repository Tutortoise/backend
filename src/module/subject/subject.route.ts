import * as subjectController from "@/module/subject/subject.controller";
import { Router } from "express";

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

export default subjectRouter;
