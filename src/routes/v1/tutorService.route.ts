import * as tutorServiceController from "@controllers/tutorService.controller";
import {
  firebaseAuthMiddleware,
  verifyTutor,
} from "@middleware/auth.middleware";
import { validator } from "@middleware/validation.middleware";
import { updateTutorServiceSchema } from "@schemas/tutorService.schema";
import { Router } from "express";

// /api/v1/tutors/services
const tutorServiceRouter = Router();
tutorServiceRouter.use(firebaseAuthMiddleware);
tutorServiceRouter.use(verifyTutor);

tutorServiceRouter.post("/", tutorServiceController.createService);
tutorServiceRouter.patch(
  "/:tutorServiceId",
  validator(updateTutorServiceSchema),
  tutorServiceController.updateService,
);

export default tutorServiceRouter;
