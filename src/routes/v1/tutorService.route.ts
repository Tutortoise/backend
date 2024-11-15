import * as tutorServiceController from "@controllers/tutorService.controller";
import {
  firebaseAuthMiddleware,
  verifyTutor,
} from "@middleware/auth.middleware";
import { Router } from "express";

// /api/v1/tutors/services
const tutorServiceRouter = Router();
tutorServiceRouter.use(firebaseAuthMiddleware);
tutorServiceRouter.use(verifyTutor);

tutorServiceRouter.post("/", tutorServiceController.createService);

export default tutorServiceRouter;
