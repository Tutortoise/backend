import * as tutorServiceController from "@/module/tutor-service/tutorService.controller";
import {
  firebaseAuthMiddleware,
  verifyTutor,
} from "@/module/auth/auth.middleware";
import { validator } from "@middleware/validation.middleware";
import {
  createTutorServiceSchema,
  updateTutorServiceSchema,
} from "@/module/tutor-service/tutorService.schema";
import { Router } from "express";

// /api/v1/tutors/services
const tutorServiceRouter = Router();
tutorServiceRouter.use(firebaseAuthMiddleware);

tutorServiceRouter.get("/", tutorServiceController.getServices);
tutorServiceRouter.get("/:tutorServiceId", tutorServiceController.getService);

tutorServiceRouter.use(verifyTutor);

tutorServiceRouter.get("/me", tutorServiceController.getMyServices);

tutorServiceRouter.post(
  "/",
  validator(createTutorServiceSchema),
  tutorServiceController.createService,
);
tutorServiceRouter.patch(
  "/:tutorServiceId",
  validator(updateTutorServiceSchema),
  tutorServiceController.updateService,
);
tutorServiceRouter.delete(
  "/:tutorServiceId",
  tutorServiceController.deleteService,
);

export default tutorServiceRouter;
