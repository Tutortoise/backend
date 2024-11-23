import {
  firebaseAuthMiddleware,
  verifyTutor,
} from "@/module/auth/auth.middleware";
import * as tutoriesController from "@/module/tutories/tutories.controller";
import {
  createTutorServiceSchema,
  updateTutorServiceSchema,
} from "@/module/tutories/tutories.schema";
import { validator } from "@middleware/validation.middleware";
import { Router } from "express";

// /api/v1/tutors/services
const tutorServiceRouter = Router();
tutorServiceRouter.use(firebaseAuthMiddleware);

tutorServiceRouter.get("/", tutoriesController.getServices);
tutorServiceRouter.get("/:tutorServiceId", tutoriesController.getService);
tutorServiceRouter.get(
  "/:tutorServiceId/availability",
  tutoriesController.getServiceAvailability,
);

tutorServiceRouter.use(verifyTutor);

tutorServiceRouter.get("/me", tutoriesController.getMyServices);

tutorServiceRouter.post(
  "/",
  validator(createTutorServiceSchema),
  tutoriesController.createService,
);
tutorServiceRouter.patch(
  "/:tutorServiceId",
  validator(updateTutorServiceSchema),
  tutoriesController.updateService,
);
tutorServiceRouter.delete("/:tutorServiceId", tutoriesController.deleteService);

export default tutorServiceRouter;
