import * as categoryController from "@/module/category/category.controller";
import { Router } from "express";
import { jwtAuthMiddleware, verifyTutor } from "../auth/auth.middleware";

// /api/v1/categories
const categoryRouter = Router();

categoryRouter.get(
  "/",
  // #swagger.tags = ['categories']
  categoryController.getAllCategories,
);

categoryRouter.get(
  "/popular",
  // #swagger.tags = ['categories']
  // #swagger.description = 'Get categories sorted by number of available tutories'
  categoryController.getPopularCategories,
);

categoryRouter.get(
  "/available",
  // #swagger.tags = ['categories']
  // #swagger.description = 'Get categories that are available for selection, excluding categories that are already selected by the tutor'
  jwtAuthMiddleware,
  verifyTutor,
  categoryController.getAvailableCategories,
);

export default categoryRouter;
