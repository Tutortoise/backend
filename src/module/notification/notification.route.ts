import { jwtAuthMiddleware } from "@/module/auth/auth.middleware";
import { Router } from "express";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "./notification.controller";
import { validator } from "@middleware/validation.middleware";
import {
  getNotificationsSchema,
  markAsReadSchema,
} from "./notification.schema";

const notificationRouter = Router();

notificationRouter.use(jwtAuthMiddleware);

notificationRouter.get(
  "/",
  // #swagger.tags = ['notifications']
  validator(getNotificationsSchema),
  getNotifications,
);

notificationRouter.post(
  "/:notificationId/read",
  // #swagger.tags = ['notifications']
  validator(markAsReadSchema),
  markAsRead,
);

notificationRouter.post(
  "/read-all",
  // #swagger.tags = ['notifications']
  markAllAsRead,
);

export default notificationRouter;
