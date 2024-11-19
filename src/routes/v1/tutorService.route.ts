import * as tutorServiceController from "@controllers/tutorService.controller";
import {
  firebaseAuthMiddleware,
  verifyTutor,
} from "@middleware/auth.middleware";
import { validator } from "@middleware/validation.middleware";
import {
  createTutorServiceSchema,
  updateTutorServiceSchema,
} from "@schemas/tutorService.schema";
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
