import { Router } from "express";
import {
  firebaseAuthMiddleware,
  verifyLearner,
} from "@/module/auth/auth.middleware";
import * as sessionRatingController from "./sessionRating.controller";
import { validator } from "@middleware/validation.middleware";
import { createSessionRatingSchema } from "./sessionRating.schema";

const sessionRatingRouter = Router();

sessionRatingRouter.use(firebaseAuthMiddleware);

sessionRatingRouter.get(
  "/:tutorServiceId",
  sessionRatingController.getTutorSessionRatings,
);

sessionRatingRouter.post(
  "/",
  verifyLearner,
  validator(createSessionRatingSchema),
  sessionRatingController.createSessionRating,
);

export default sessionRatingRouter;
