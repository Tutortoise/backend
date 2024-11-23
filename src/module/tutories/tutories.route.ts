import { jwtAuthMiddleware, verifyTutor } from "@/module/auth/auth.middleware";
import * as tutoriesController from "@/module/tutories/tutories.controller";
import {
  createTutoriesSchema,
  updateTutoriesSchema as updateTutoriesSchema,
} from "@/module/tutories/tutories.schema";
import { validator } from "@middleware/validation.middleware";
import { Router } from "express";

// /api/v1/tutors/services
const tutoriesRouter = Router();
tutoriesRouter.use(jwtAuthMiddleware);

tutoriesRouter.get("/", tutoriesController.getAllTutories);
tutoriesRouter.get("/:tutoriesId", tutoriesController.getTutories);
tutoriesRouter.get(
  "/:tutoriesId/availability",
  tutoriesController.getTutoriesAvailability,
);

tutoriesRouter.use(verifyTutor);

tutoriesRouter.get("/me", tutoriesController.getMyTutories);

tutoriesRouter.post(
  "/",
  validator(createTutoriesSchema),
  tutoriesController.createTutories,
);
tutoriesRouter.patch(
  "/:tutoriesId",
  validator(updateTutoriesSchema),
  tutoriesController.updateTutories,
);
tutoriesRouter.delete("/:tutoriesId", tutoriesController.deleteTutories);

export default tutoriesRouter;
