import * as subjectController from "@/module/subject/subject.controller";
import { Router } from "express";

// /api/v1/subjects
const subjectRouter = Router();

subjectRouter.get(
  "/",
  // #swagger.tags = ['subjects']
  subjectController.getAllSubjects,
);

export default subjectRouter;
