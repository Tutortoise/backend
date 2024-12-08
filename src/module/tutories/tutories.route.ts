import { jwtAuthMiddleware, verifyTutor } from "@/module/auth/auth.middleware";
import * as tutoriesController from "@/module/tutories/tutories.controller";
import {
  createTutoriesSchema,
  getAverageRateSchema,
  getTutoriesSchema,
  updateTutoriesSchema,
} from "@/module/tutories/tutories.schema";
import { validator } from "@middleware/validation.middleware";
import { Router } from "express";

// /api/v1/tutors/services
const tutoriesRouter = Router();
tutoriesRouter.use(jwtAuthMiddleware);

tutoriesRouter.get(
  "/",
  // #swagger.tags = ['tutors/services']
  validator(getTutoriesSchema),
  tutoriesController.getAllTutories,
);

tutoriesRouter.get(
  "/avg-rate",
  // #swagger.tags = ['tutors/services']
  validator(getAverageRateSchema),
  tutoriesController.getAverageRate,
);

tutoriesRouter.get(
  "/locations",
  // #swagger.tags = ['tutors/services']
  tutoriesController.getLocations,
);

tutoriesRouter.get(
  "/:tutoriesId",
  // #swagger.tags = ['tutors/services']
  tutoriesController.getTutories,
);

tutoriesRouter.use(verifyTutor);

tutoriesRouter.get(
  "/me",
  // #swagger.tags = ['tutors/services']
  tutoriesController.getMyTutories,
);

tutoriesRouter.post(
  "/",
  /* #swagger.tags = ['tutors/services']
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/CreateTutoriesSchema" }
  } */
  validator(createTutoriesSchema),
  tutoriesController.createTutories,
);
tutoriesRouter.patch(
  "/:tutoriesId",
  /* #swagger.tags = ['tutors/services']
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/UpdateTutoriesSchema" }
  } */
  validator(updateTutoriesSchema),
  tutoriesController.updateTutories,
);
tutoriesRouter.delete(
  "/:tutoriesId",
  // #swagger.tags = ['tutors/services']
  tutoriesController.deleteTutories,
);

export default tutoriesRouter;
