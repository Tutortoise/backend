import { Router } from "express";
import * as subjectController from "@/module/subject/subject.controller";

// /api/v1/subjects
const subjectRouter = Router();

subjectRouter.get("/", subjectController.getAllSubjects);

export default subjectRouter;
