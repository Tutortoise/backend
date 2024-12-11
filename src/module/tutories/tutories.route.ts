import {
  jwtAuthMiddleware,
  verifyLearner,
  verifyTutor,
} from "@/module/auth/auth.middleware";
import * as tutoriesController from "@/module/tutories/tutories.controller";
import {
  createTutoriesSchema,
  getAverageRateSchema,
  getTutoriesSchema,
  trackInteractionSchema,
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
  // #swagger.description = 'Get all tutories (tutor services)'
  validator(getTutoriesSchema),
  tutoriesController.getAllTutories,
);

tutoriesRouter.get(
  "/avg-rate",
  // #swagger.tags = ['tutors/services']
  // #swagger.description = 'Get average hourly rate of tutories in specified category, city, or district)'
  validator(getAverageRateSchema),
  tutoriesController.getAverageRate,
);

tutoriesRouter.get(
  "/locations",
  // #swagger.tags = ['tutors/services']
  // #swagger.description = 'Get all locations where tutories are available'
  tutoriesController.getLocations,
);

tutoriesRouter.get(
  "/recommendations",
  // #swagger.tags = ['tutors/services']
  // #swagger.description = 'Get recommended tutories for learner'
  verifyLearner,
  tutoriesController.getRecommendations,
);

tutoriesRouter.get(
  "/interaction/:tutoriesId",
  // #swagger.tags = ['tutors/services']
  // #swagger.description = 'Track interaction with tutories (view)'
  verifyLearner,
  validator(trackInteractionSchema),
  tutoriesController.trackInteraction,
);

tutoriesRouter.get(
  "/:tutoriesId",
  // #swagger.tags = ['tutors/services']
  // #swagger.description = 'Get details of a tutories'
  tutoriesController.getTutories,
);

// Tutor only routes

tutoriesRouter.use(verifyTutor);

tutoriesRouter.get(
  "/me",
  // #swagger.tags = ['tutors/services']
  // #swagger.description = 'Get all tutories of current logged in tutor'
  tutoriesController.getMyTutories,
);

tutoriesRouter.post(
  "/",
  /* #swagger.tags = ['tutors/services']
     #swagger.description = 'Create a new tutories (tutor service)'
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/CreateTutoriesSchema" }
  } */
  validator(createTutoriesSchema),
  tutoriesController.createTutories,
);
tutoriesRouter.patch(
  "/:tutoriesId",
  /* #swagger.tags = ['tutors/services']
  # #swagger.description = 'Update a tutories (tutor service)'
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/UpdateTutoriesSchema" }
  } */
  validator(updateTutoriesSchema),
  tutoriesController.updateTutories,
);
tutoriesRouter.delete(
  "/:tutoriesId",
  // #swagger.tags = ['tutors/services']
  // #swagger.description = 'Delete a tutories (tutor service)'
  tutoriesController.deleteTutories,
);

export default tutoriesRouter;
