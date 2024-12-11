import {
  jwtAuthMiddleware,
  verifyLearner,
} from "@/module/auth/auth.middleware";
import { changePasswordSchema } from "@/module/auth/auth.schema";
import * as learnerController from "@/module/learner/learner.controller";
import {
  updateInterestsSchema,
  updateLearningStyleSchema,
  updateProfileSchema,
} from "@/module/learner/learner.schema";
import {
  validateProfilePictureUpload,
  validator,
} from "@middleware/validation.middleware";
import { Router } from "express";

// /api/v1/learners
const learnerRouter = Router();
learnerRouter.use(jwtAuthMiddleware);
learnerRouter.use(verifyLearner);

learnerRouter.get(
  "/profile",
  // #swagger.tags = ['learners']
  // #swagger.description = 'Get the profile data of the currently logged in learner'
  learnerController.getProfile,
);

learnerRouter.patch(
  "/profile",
  /* #swagger.tags = ['learners']
  #swagger.description = 'Update the profile data of the currently logged in learner'
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/UpdateLearnerProfileSchema" }
  } */
  validator(updateProfileSchema),
  learnerController.updateProfile,
);

learnerRouter.patch(
  "/profile/learning-style",
  /* #swagger.tags = ['learners']
  #swagger.description = 'Update the learning style of the currently logged in learner'
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/UpdateLearningStyleSchema" }
  } */
  validator(updateLearningStyleSchema),
  learnerController.updateLearningStyle,
);

learnerRouter.patch(
  "/profile/interests",
  /* #swagger.tags = ['learners']
  #swagger.description = 'Update the interests of the currently logged in learner'
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/UpdateInterestsSchema" }
  } */
  validator(updateInterestsSchema),
  learnerController.updateInterests,
);

learnerRouter.put(
  "/profile/picture",
  /* #swagger.tags = ['learners']
    #swagger.description = 'Update the profile picture of the currently logged in learner'
    #swagger.requestBody = {
      required: true,
      content: {
        'image/jpg': {
          schema: {  type: 'string', format: 'binary' }
        }
      }
    } */
  validateProfilePictureUpload,
  learnerController.updateProfilePicture,
);

learnerRouter.put(
  "/password",
  /* #swagger.tags = ['learners']
  #swagger.description = 'Change the password of the currently logged in learner'
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/ChangePasswordSchema" }
  } */
  validator(changePasswordSchema),
  learnerController.changePassword,
);

export default learnerRouter;
